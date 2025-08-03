import {
  TouchableOpacity,
  View,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import React, { useContext, useState } from 'react';
import { defaultStyles, loginstyles, signupStyles } from '@/styles';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { Appbar, Button, Icon, Text } from 'react-native-paper';
import i18n from '@/i18n';
import { Context, ContextType } from '../_layout';

const Register = () => {
  const router = useRouter();
  const { role, setUserRole } = useContext(Context) as ContextType;

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(auth).register.createAccount')}
            </Text>
            <View />
          </Appbar.Header>

          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled">
            <View style={loginstyles.logoCircle}>
              <Text style={loginstyles.logoText}>Food House</Text>
            </View>

            <View style={signupStyles.content}>
              <Text style={loginstyles.loginTitle}>
                {i18n.t('(auth).register.registerNewAccount')}
              </Text>
              <Text style={signupStyles.subheading}>
                {i18n.t('(auth).register.description')}
              </Text>

              <View style={signupStyles.roleContainer}>
                <TouchableOpacity
                  style={[
                    signupStyles.roleCard,
                    role === 'USER_TYPE_BUYER' && signupStyles.selectedRoleCard,
                  ]}
                  onPress={() => setUserRole('USER_TYPE_BUYER')}>
                  <ImageBackground
                    source={require('@/assets/images/buyer.png')}
                    style={signupStyles.roleImageBackground}
                    imageStyle={signupStyles.roleImage}>
                    <View style={signupStyles.textOverlay}>
                      <Text style={signupStyles.roleText}>
                        {' '}
                        {i18n.t('(auth).register.buyer')}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    signupStyles.roleCard,
                    role === 'USER_TYPE_FARMER' &&
                      signupStyles.selectedRoleCard,
                  ]}
                  onPress={() => setUserRole('USER_TYPE_FARMER')}>
                  <ImageBackground
                    source={require('@/assets/images/farmer.png')}
                    style={signupStyles.roleImageBackground}
                    imageStyle={signupStyles.roleImage}>
                    <View style={signupStyles.textOverlay}>
                      <Text style={signupStyles.roleText}>
                        {' '}
                        {i18n.t('(auth).register.seller')}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={defaultStyles.bottomContainerWithContent}>
            <Button
              mode="contained"
              onPress={() => router.push('/info')}
              textColor={Colors.light['10']}
              buttonColor={Colors.primary['500']}
              style={defaultStyles.button}
              disabled={!role}>
              {i18n.t('(auth).register.button')}
            </Button>

            <View style={loginstyles.registerContainer}>
              <Text style={loginstyles.registerText}>
                {i18n.t('(auth).register.havingAccount')}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={loginstyles.registerLink}>
                  {' '}
                  {i18n.t('(auth).register.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};
export default Register;
