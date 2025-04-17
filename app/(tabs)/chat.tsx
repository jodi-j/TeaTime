import React from "react";
import { FlatList, TouchableOpacity, Text } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Avatar, AvatarImage } from "@/components/ui/avatar"

import { useRouter } from "expo-router";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
};

const mockChats = [
  {
    id: "1",
    name: "Alice Johnson",
    lastMessage: "See you tomorrow!",
    timestamp: "10:24 AM",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "2",
    name: "Bob Smith",
    lastMessage: "Thanks for the update!",
    timestamp: "9:02 AM",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "3",
    name: "Charlie Adams",
    lastMessage: "Let’s meet at 5.",
    timestamp: "Yesterday",
    avatar: "https://randomuser.me/api/portraits/men/87.jpg",
  },
];

export default function chat() {
  const router = useRouter();

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: "/[id]", params: { id: item.id } } as never)}>
      <HStack
        space="md"
        style={{ alignItems: 'center', padding: 4, borderBottomWidth: 1 }}
      >
        <Avatar size="md">
          <AvatarImage source={{ uri: item.avatar }} />
        </Avatar>
        <VStack style={{ flex: 1 }}>
          <HStack style={{justifyContent:"space-between"}}>
            <Text style={{fontWeight:"bold"}}>{item.name}</Text>
            <Text>
              {item.timestamp}
            </Text>
          </HStack>
          <Text numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </VStack>
      </HStack>
    </TouchableOpacity>
  );

  return (
    <VStack style={{ flex:1 }} >
      <FlatList
        data={mockChats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </VStack>
  );
}
