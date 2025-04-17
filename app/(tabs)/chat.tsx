import React from "react";
import { FlatList, TouchableOpacity, Text } from "react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { mockChats } from "../mockData";

import { useRouter } from "expo-router";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
};

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
