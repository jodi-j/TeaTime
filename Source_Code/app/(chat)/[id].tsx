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
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);

  const recipientId = typeof id === 'string' ? id : id[0];

  useEffect(() => {
    console.log('Chat screen mounted with id:', id);
    loadContactInfo();
    loadMessages();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [id]);

  const loadContactInfo = async () => {
    try {
      console.log('Loading contact info for id:', id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', id)
        .single();

      if (error) {
        console.error('Error loading contact info:', error);
        throw error;
      }
      if (data) {
        console.log('Contact info loaded:', data);
        setContactName(data.display_name);
        navigation.setOptions({
          title: data.display_name,
          headerBackTitle: "Chat",
          headerTintColor: "#aa786d",
        });
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('Starting to load messages...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Loading messages from database...');
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      console.log('Getting user private key...');
      const { data: keyProfile, error: keyError } = await supabase
        .from('user_profiles')
        .select('private_key')
        .eq('user_id', user.id)
        .single();

      if (keyError) {
        console.error('Error fetching user private key:', keyError);
        throw keyError;
      }
      if (!keyProfile?.private_key) {
        console.error('Private key not found for user:', user.id);
        throw new Error('Private key not found');
      }

      console.log('Processing messages...');
      const formattedMessages: Message[] = await Promise.all(
        data.map(async (msg) => {
          const isIncoming = msg.receiver_id === user.id;

          try {
            console.log('Decrypting message:', msg.id);
            const encryptedMessage = isIncoming 
              ? msg.encrypted_message_for_receiver 
              : msg.encrypted_message_for_sender;
            
            const decrypted = await decryptMessage(
              encryptedMessage,
              keyProfile.private_key
            );

            return {
              id: msg.id,
              text: decrypted,
              sender: isIncoming ? 'other' : 'me',
              timestamp: msg.timestamp,
            };
          } catch (err) {
            console.error('Failed to decrypt message:', msg.id, err);
            return {
              id: msg.id,
              text: 'Unable to decrypt message',
              sender: isIncoming ? 'other' : 'me',
              timestamp: msg.timestamp,
            };
          }
        })
      );

      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
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
    if (inputText.trim() === "") {
      console.log('Empty message, not sending');
      return;
    }

    console.log('Starting to send message:', inputText);
    const tempId = Date.now();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Getting keys...');
      const [
        { data: senderProfile, error: senderError },
        { data: recipientProfile, error: recipientError }
      ] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('public_key')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_profiles')
          .select('public_key')
          .eq('user_id', recipientId)
          .single()
      ]);

      if (senderError || recipientError) {
        console.error('Error fetching keys:', { senderError, recipientError });
        throw senderError || recipientError;
      }
      if (!senderProfile?.public_key || !recipientProfile?.public_key) {
        console.error('Public keys not found');
        throw new Error('Public keys not found');
      }

      console.log('Encrypting messages...');
      const [encryptedForReceiver, encryptedForSender] = await Promise.all([
        encryptMessage(inputText, recipientProfile.public_key),
        encryptMessage(inputText, senderProfile.public_key)
      ]);
      console.log('Messages encrypted successfully');

      const newMessage: Message = {
        id: tempId,
        text: inputText,
        sender: 'me',
        timestamp: new Date().toISOString(),
      };
      console.log('Adding message to UI:', newMessage);
      setMessages(prev => [...prev, newMessage]);
      setInputText("");

      console.log('Saving message to database...');
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: recipientId,
            encrypted_message_for_receiver: encryptedForReceiver,
            encrypted_message_for_sender: encryptedForSender,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw error;
      }

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMessages();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <SafeAreaView style={styles.container}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000"
              title="Pull to refresh"
              titleColor="#666"
            />
          }
          inverted={false}
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
    backgroundColor: "#c49a8c",
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
    backgroundColor: "#dca65e",
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
