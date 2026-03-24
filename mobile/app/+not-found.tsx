import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import i18n from '@/i18n';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: i18n.t('common.notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t('common.notFound.message')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{i18n.t('common.notFound.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
