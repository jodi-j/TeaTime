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
import { mockChats } from "../mockData";

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();
  
    const chat = mockChats.find((chat) => chat.id === id);
  
    const [messages, setMessages] = useState([
      { id: 'init', text: chat?.lastMessage ?? 'Hello!', sender: 'other' },
    ]);
    const [inputText, setInputText] = useState("");
  
    useEffect(() => {
      navigation.setOptions({
        title: chat ? chat.name : `Chat with ${id}`,
        headerBackTitle: "Chat",
      });
    }, [id]);
  
    const sendMessage = () => {
      if (inputText.trim() === "") return;
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'me',
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
    };
  
    const renderItem = ({ item }: { item: typeof messages[0] }) => (
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
            <Image source={{ uri: chat?.avatar }} style={styles.avatar} />
            <Text style={styles.chatName}>{chat?.name}</Text>
          </View>
  
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
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
