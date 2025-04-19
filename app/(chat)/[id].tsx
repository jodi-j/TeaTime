import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { supabase } from "../../utils/supabase";
import { encryptMessage, decryptMessage } from "../../utils/crypto";

type Message = {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactAvatar, setContactAvatar] = useState("https://randomuser.me/api/portraits/women/44.jpg");

  useEffect(() => {
    loadContactInfo();
    loadMessages();
    setupRealtimeSubscription();
  }, [id]);

  const loadContactInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', id)
        .single();

      if (error) throw error;
      if (data) {
        setContactName(data.display_name);
        navigation.setOptions({
          title: data.display_name,
          headerBackTitle: "Chat",
        });
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Getting user private key...');
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('private_key')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!userProfile?.private_key) throw new Error('Private key not found');
      console.log('User private key:', userProfile.private_key);

      console.log('Loading messages from database...');
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (data) {
        console.log('Raw messages from database:', data);
        const formattedMessages: Message[] = await Promise.all(
          data.map(async (msg) => {
            const isSender = msg.sender_id === user.id;
            try {
              const decryptedMessage = await decryptMessage(
                msg.encrypted_message,
                userProfile.private_key
              );
              return {
                id: msg.id,
                text: decryptedMessage,
                sender: isSender ? 'me' : 'other',
                timestamp: msg.timestamp,
              };
            } catch (err) {
              console.error('Decryption failed for message:', msg.id, err);
              return {
                id: msg.id,
                text: 'Unable to decrypt message',
                sender: isSender ? 'me' : 'other',
                timestamp: msg.timestamp,
              };
            }
          })
        );
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (inputText.trim() === "") return;

    const tempId = Date.now();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Getting recipient private key...');
      const { data: recipientProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('private_key')
        .eq('user_id', id)
        .single();

      if (profileError) throw profileError;
      if (!recipientProfile?.private_key) throw new Error('Recipient public key not found');
      console.log('Recipient public key:', recipientProfile.private_key);

      console.log('Encrypting message...');
      const encryptedMessage = await encryptMessage(inputText, recipientProfile.private_key);
      console.log('Message details:', {
        original: inputText,
        encrypted: encryptedMessage,
        recipient_id: id,
        recipient_private_key: recipientProfile.private_key
      });

      const newMessage: Message = {
        id: tempId,
        text: inputText,
        sender: 'me',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText("");

      console.log('Saving message to database...');
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: id,
            encrypted_message: encryptedMessage,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        console.log('Message saved successfully:', data);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: data.id, timestamp: data.timestamp }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "me" ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={{ uri: contactAvatar }} style={styles.avatar} />
          <Text style={styles.chatName}>{contactName}</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
        />

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Text style={{ color: "white" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#ECECEC",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    height: 'auto',
  },
  input: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "blue",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 24,
  },
});
