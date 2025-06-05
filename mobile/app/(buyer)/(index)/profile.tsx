import { Context, ContextType } from "@/app/_layout";
import { usersRevokeRefreshTokenMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { clearStorage, readData, updateAuthHeader } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(Context) as ContextType;

  const router = useRouter();

  const handleLogout = async () => {
    try {
      setLoading(true);
      const refreshToken = await readData("@refreshToken");

      await revokeRefreshToken({
        body: {
          refreshToken,
        },
      });

      await clearStorage();
      updateAuthHeader("");
      setUser(undefined);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error({ error }, "logging out");
    } finally {
      setLoading(false);
    }
  };

  const { mutateAsync: revokeRefreshToken } = useMutation({
    ...usersRevokeRefreshTokenMutation(),
    onError: async (error) => {
      console.error("error logging out: ", error);
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Button onPress={handleLogout} loading={loading} disabled={loading}>
        <Text>Logout</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
