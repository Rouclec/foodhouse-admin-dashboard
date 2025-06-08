import { usersRevokeRefreshTokenMutation } from "@/client/users.swagger/@tanstack/react-query.gen";
import { clearStorage, readData, updateAuthHeader } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { Context, ContextType } from "../../_layout";

export default function TabTwoScreen() {
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
      <Text style={styles.title}>Tab Two</Text>
      <Button onPress={handleLogout} loading={loading} disabled={loading}>
        <Text>Logout</Text>
      </Button>
      <View style={styles.separator} />
      {/* <EditScreenInfo path="app/(tabs)/two.tsx" /> */}
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
