import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from 'react-native';
import {
  Appbar,
  Icon,
  TextInput,
  Button,
  Dialog,
  Portal,
  Text,
  Avatar,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { signupStyles, defaultStyles } from '@/styles';
import { router } from 'expo-router';
import { usersCompleteRegistrationMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { delay, uploadImage, useCompressImage } from '@/utils';
import { Context, ContextType } from '../_layout';
import i18n from '@/i18n';
import { Dropdown, ImagePicker } from '@/components';
import { Chase } from 'react-native-animated-spinkit';
import { Colors, emailRegex } from '@/constants';

import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
  GooglePlaceData,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';

import { UsersCompleteRegistrationBody } from '@/client/users.swagger';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
// import { ScrollView } from 'react-native-virtualized-view';

const ProfilePage = () => {
  const { user, setUser } = useContext(Context) as ContextType;
  const [firstName, setFirstName] = useState(user?.firstName);
  const [lastName, setLastName] = useState(user?.lastName);
  const [email, setEmail] = useState(user?.email);
  const [address, setAddress] = useState(user?.address);
  const [locationCoordinates, setLocationCoordinates] = useState(
    user?.locationCoordinates,
  );
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<
    ExpoImagePicker.ImagePickerAsset | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [enteringReferal, setEnteringReferal] = useState<'yes' | 'no'>();

  const googlePlacesAutoCompleteRef = useRef<GooglePlacesAutocompleteRef>(null);

  const [referralCode, setReferralCode] = useState<string>();
  const [checkError, setCheckError] = useState(false);
  

  const { mutateAsync: updateUserRegistration } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onError: async error => {
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).profile.unknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
    onSuccess: async () => {
      setSuccessModalVisible(true);
      setTimeout(() => {
        if (user?.role === 'USER_ROLE_FARMER') {
          router.replace('/(farmer)/(index)');
        } else {
          router.replace('/(buyer)/(index)');
        }
      }, 3000);
    },
  });

  const {
    compressImage,
    // loading: isCompressing,
    // error: compressionError,
  } = useCompressImage(profileImage?.uri ?? '');

  const handleComplete = async () => {
    try {
      setCheckError(true);
      setLoading(true);
      let imageUrl = user?.profileImage || null;

      if (profileImage) {
        const imageUri = await compressImage();
        imageUrl = await uploadImage({
          uri: imageUri,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: 'profile_images',
        });
      }

      if (!firstName) {
        return;
      }

      if (user?.role === 'USER_ROLE_BUYER') {
        if (!enteringReferal) return;
        if (
          enteringReferal === 'yes' &&
          (!referralCode || (!!referralCode && referralCode.length < 7))
        )
          return;
      } else {
        if (!imageUrl) {
          setError(true);
          setErrorMessage(i18n.t('(auth).profile.profileImageRequired'));
          await delay(5000);
          setError(false);
          setErrorMessage(undefined);
          return;
        }
        if (!locationCoordinates || !address) {
          setError(true);
          setErrorMessage(i18n.t('(auth).profile.selectAValidAddress'));
          await delay(5000);
          setError(false);
          setErrorMessage(undefined);
          return;
        }
      }
      

      const data: UsersCompleteRegistrationBody = {
        firstName,
        lastName,
        email,
        address,
        profileImage: imageUrl || undefined,

        locationCoordinates: locationCoordinates ?? undefined,
        referredBy: referralCode,
      };
      

      await updateUserRegistration({
        body: data,
        path: {
          userId: user?.userId ?? '',
        },
      });
      setUser({ ...user, ...data });
    } catch (error) {
      console.error('Error completing registration:', error);
      // setErrorMessage(i18n.t('(auth).profile.uploadError'));
      // setError(true);
      // await delay(5000);
      // setError(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (
    data: GooglePlaceData,
    details: GooglePlaceDetail | null,
  ) => {
    setAddress(data.description);
    if (details?.geometry?.location) {
      setLocationCoordinates({
        lat: details.geometry.location.lat,
        lon: details.geometry.location.lng,
        address: data.description,
      });
    } else {
      setLocationCoordinates(undefined);
    }
  };

  useEffect(() => {
    if (
      user?.locationCoordinates?.address &&
      googlePlacesAutoCompleteRef?.current
    ) {
      googlePlacesAutoCompleteRef.current.setAddressText(
        user?.locationCoordinates?.address,
      );
    }
  }, [user, googlePlacesAutoCompleteRef]);

  return (
    <>
      <View style={[defaultStyles.flex, defaultStyles.container]}>
        <Appbar.Header dark={false} style={defaultStyles.appHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={defaultStyles.backButtonContainer}>
            <Icon source={'arrow-left'} size={24} />
          </TouchableOpacity>
          <Text variant="titleMedium" style={defaultStyles.heading}>
            {i18n.t('(auth).profile.completeRegistration')}
          </Text>
          <View />
        </Appbar.Header>
        <View style={signupStyles.imageContainer}>
          <TouchableOpacity
            onPress={() => setIsImagePickerVisible(true)}
            style={signupStyles.imageUpload}>
            {profileImage?.uri ? (
              <Image
                source={{ uri: profileImage.uri }}
                style={signupStyles.profileImage}
              />
            ) : (
              <View style={signupStyles.addImageContainer}>
                <Avatar.Icon
                  size={120}
                  icon="account"
                  style={signupStyles.account}
                />
                <Avatar.Icon
                  size={24}
                  icon="camera"
                  color="#fff"
                  style={signupStyles.cameraIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <KeyboardAwareScrollView
          contentContainerStyle={defaultStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled>
          <View style={signupStyles.allInput}>
            <View style={signupStyles.inputGap}>
              <TextInput
                label={i18n.t('(auth).profile.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                error={
                  (checkError && !firstName) ||
                  (!!firstName && firstName.length < 3)
                }
                outlineColor={Colors.grey['bg']}
              />
              {((checkError && !firstName) ||
                (!!firstName && firstName.length < 3)) && (
                <HelperText style={defaultStyles.errorText} type="error">
                  {i18n.t('(auth).profile.firstNameRequired')}
                </HelperText>
              )}
            </View>

            <TextInput
              label={i18n.t('(auth).profile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={defaultStyles.input}
              theme={{
                colors: {
                  primary: Colors.primary[500],
                  background: Colors.grey['fa'],
                  error: Colors.error,
                },
                roundness: 10,
              }}
              outlineColor={Colors.grey['bg']}
            />

            <View style={signupStyles.inputGap}>
              <TextInput
                mode="outlined"
                label={i18n.t('(auth).profile.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!email && email?.length > 0 && !emailRegex.test(email)}
                outlineColor={Colors.grey['bg']}
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
              />
              {!!email && email?.length > 0 && !emailRegex.test(email) && (
                <HelperText style={defaultStyles.errorText} type="error">
                  {i18n.t('(auth).profile.enterValidEmail')}
                </HelperText>
              )}
            </View>
            <View style={defaultStyles.flex}>
              <GooglePlacesAutocomplete
                keyboardShouldPersistTaps="always"
                disableScroll
                ref={googlePlacesAutoCompleteRef}
                placeholder={i18n.t(
                  '(farmer).(profile-flow).(personal-info).address',
                )}
                query={{
                  key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_AUTOCOMPLETE_KEY,
                  language: 'en',
                }}
                styles={{
                  textInput: {
                    ...defaultStyles.input,
                    backgroundColor: Colors.light[10],
                    height: 56,
                    borderRadius: 15,
                    borderColor: Colors.grey['bg'],
                    borderWidth: 1,
                    paddingLeft: 28,
                    fontWeight: '500',
                  },
                  listView: {
                    backgroundColor: Colors.light[10],
                    borderRadius: 15,
                    marginTop: 5,
                    elevation: 3,
                    // position: 'absolute',
                    // top: -216,
                    height: 200, // scroll instead of pushing UI
                    zIndex: 9999,
                  },
                  row: {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  },
                }}
                renderRow={data => (
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <Text
                      style={{
                        flexShrink: 1, // critical for wrapping
                        flexGrow: 1,
                        fontSize: 14,
                        lineHeight: 18,
                        color: Colors.grey['3c'],
                      }}
                      numberOfLines={0} // unlimited wrapping
                    >
                      {data.description}
                    </Text>
                  </View>
                )}
                textInputProps={{
                  placeholderTextColor: Colors.grey['3c'],
                  value: address,
                  onChangeText: text => setAddress(text),
                }}
                onPress={(data, details) => handleAddressSelect(data, details)}
                fetchDetails={true}
                nearbyPlacesAPI="GooglePlacesSearch"
                debounce={200}
                timeout={20000}
                minLength={3}
                enablePoweredByContainer={false}
                predefinedPlaces={[]}
              />
              {checkError &&
                user?.role === 'USER_ROLE_FARMER' &&
                !locationCoordinates && (
                  <HelperText style={defaultStyles.errorText} type="error">
                    {i18n.t('(auth).profile.selectAValidAddress')}
                  </HelperText>
                )}
            </View>
            {user?.role === 'USER_ROLE_BUYER' && (
              <Dropdown
                label={i18n.t('(auth).profile.doYouHaveAReferralCode')}
                value={enteringReferal}
                onSelect={value => setEnteringReferal(value as 'yes' | 'no')}
                data={[
                  {
                    label: 'Yes',
                    value: 'yes',
                  },
                  {
                    label: 'No',
                    value: 'no',
                  },
                ]}
                error={
                  checkError && !enteringReferal
                    ? i18n.t('(auth).profile.pleaseSelectThisOption')
                    : undefined
                }
              />
            )}
            {user?.role === 'USER_ROLE_BUYER' && enteringReferal === 'yes' && (
              <TextInput
                label={i18n.t('(auth).profile.referralCode')}
                value={referralCode}
                onChangeText={setReferralCode}
                mode="outlined"
                style={defaultStyles.input}
                theme={{
                  colors: {
                    primary: Colors.primary[500],
                    background: Colors.grey['fa'],
                    error: Colors.error,
                  },
                  roundness: 10,
                }}
                autoCapitalize="characters"
                outlineColor={Colors.grey['bg']}
                error={
                  enteringReferal === 'yes' &&
                  (!referralCode || (!!referralCode && referralCode.length < 7))
                }
              />
            )}
          </View>
        </KeyboardAwareScrollView>
      </View>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          textColor={Colors.light['0']}
          buttonColor={Colors.primary['500']}
          style={[
            defaultStyles.button,
            signupStyles.button,
            signupStyles.fullWidth,
          ]}
          loading={loading}
          disabled={
            // !firstName ||
            // (user?.role === 'USER_ROLE_FARMER' &&
            //   (!locationCoordinates || !profileImage)) ||
            loading
          }
          onPress={handleComplete}>
          <Text style={defaultStyles.buttonText}>Complete</Text>
        </Button>
      </View>

      <ImagePicker
        visible={isImagePickerVisible}
        setImage={setProfileImage}
        onClose={() => setIsImagePickerVisible(false)}
        aspect={[1, 1]}
      />

      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => {}}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Image
              source={require('@/assets/images/success.png')}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t('(auth).profile.congratulations')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(auth).profile.registrationCompleteMessage')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Chase size={56} color={Colors.primary[500]} />
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => {}}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
    </>
  );
};

export default ProfilePage;
