import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Appbar,
  Text,
  Button,
  TextInput,
  Icon,
  Snackbar,
} from 'react-native-paper';
import { Colors } from '@/constants';
import {
  defaultStyles,
  loginstyles,
  profileFlowStyles,
  signupStyles,
} from '@/styles';
import i18n from '@/i18n';
import { Context, ContextType } from '../_layout';
import { ImagePicker } from '@/components';
import { usersCompleteRegistrationMutation } from '@/client/users.swagger/@tanstack/react-query.gen';
import { delay, uploadImage, useCompressImage } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  GooglePlaceData,
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import { typesPoint } from '@/client/orders.swagger';

type FormData = {
  fullName: string;
  address: string;
  email: string;
  locationCoordinates: typesPoint | null;
};

export default function PersonalInfo() {
  const router = useRouter();
  const { user, setUser } = useContext(Context) as ContextType;
  const [formData, setFormData] = useState<FormData>({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    address: user?.locationCoordinates?.address || '',
    email: user?.email || '',
    locationCoordinates: user?.locationCoordinates || null,
  });

  const googlePlacesAutoCompleteRef = useRef<GooglePlacesAutocompleteRef>(null);
  const [lastSelectedAddress, setLastSelectedAddress] = useState<string | null>(
    formData?.locationCoordinates?.address ?? null,
  );

  const [originalProfileImage, setOriginalProfileImage] = useState(
    user?.profileImage || '',
  );
  const [profileImage, setProfileImage] = useState(originalProfileImage);

  const [loading, setLoading] = useState(false);
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [error, setError] = useState(false);
  const [isSuccess, setIsSucess] = useState(false);

  useEffect(() => {
    const changesDetected =
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() !==
      formData.fullName ||
      user?.locationCoordinates?.address !== formData.address ||
      user?.email !== formData.email ||
      profileImage !== originalProfileImage ||
      JSON.stringify(user?.locationCoordinates) !==
      JSON.stringify(formData?.locationCoordinates);

    setHasChanges(prev => (prev === changesDetected ? prev : changesDetected));
  }, [
    formData.fullName,
    formData.address,
    formData.email,
    formData.locationCoordinates,
    profileImage,
    originalProfileImage,
    user?.firstName,
    user?.lastName,
    user?.address,
    user?.email,
    user?.locationCoordinates,
  ]);

  const handleInputChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev: FormData) => {
      if (prev[field] === value) {
        return prev;
      }
      return { ...prev, [field]: value };
    });
  };

  const handleImageSelect = (asset: any) => {
    console.log('handleImageSelect: Asset received:', asset?.uri);
    if (asset && asset.uri !== originalProfileImage) {
      setProfileImage(asset.uri);
      setHasChanges(true);
    }
    setIsImagePickerVisible(false);
  };

  const handleAddressSelect = (
    data: GooglePlaceData,
    details: GooglePlaceDetail | null = null,
  ) => {
    if (!data?.description) {
      return;
    }

    const newFormData = { ...formData, address: data.description };
    let newLocation = null;

    if (details?.geometry?.location) {
      newLocation = {
        lat: details.geometry.location.lat,
        lon: details.geometry.location.lng,
        address: data.description,
      };
      newFormData.locationCoordinates = newLocation;
      setLastSelectedAddress(data.description);
    } else {
      newFormData.locationCoordinates = null;
      setLastSelectedAddress(null);
    }
    setFormData(newFormData);
  };

  const { mutateAsync: updateProfile } = useMutation({
    ...usersCompleteRegistrationMutation(),
    onSuccess: async () => {
      setIsSucess(true);
      await delay(5000);
      setIsSucess(false);
    },
    onError: async error => {
      console.error('updateProfile onError:', error);
      setErrorMessage(
        error?.response?.data?.message ?? i18n.t('(auth).profile.unknownError'),
      );
      setError(true);
      await delay(5000);
      setError(false);
    },
  });

  const {
    compressImage,
    // loading: isCompressing,
    // error: compressionError,
  } = useCompressImage(profileImage ?? '');

  const handleSave = async () => {
    try {
      setLoading(true);
      let imageUrl = originalProfileImage;

      if (profileImage !== originalProfileImage) {
        const imageUri = await compressImage();
        imageUrl = await uploadImage({
          uri: imageUri,
          filename: `profile_${user?.userId}_${Date.now()}.jpg`,
          directory: 'profile_images',
        });
      }

      const firstNameSplit = formData.fullName.split(' ')[0];
      const lastNameSplit = formData.fullName.split(' ').slice(1).join(' ');

      const data = {
        firstName: firstNameSplit,
        lastName: lastNameSplit,
        email: formData.email,
        address: formData.address,
        profileImage: imageUrl,
        locationCoordinates: formData.locationCoordinates ?? undefined,
      };

      await updateProfile({ body: data, path: { userId: user?.userId || '' } });

      setUser({ ...user, ...data });
      setOriginalProfileImage(imageUrl);
    } catch (error) {
      console.error('handleSave: Error updating profile:', error);
      setErrorMessage('Failed to update profile');
      setError(true);
      await delay(5000);
      setError(false);
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

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
      <KeyboardAvoidingView
        style={[
          defaultStyles.container,
          {
            paddingBottom: insets.bottom,
          },
        ]}
        behavior={'padding'}
        keyboardVerticalOffset={0}>
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}>
              <Icon source={'arrow-left'} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t('(farmer).(profile-flow).(personal-info).heading')}
            </Text>
            <View />
          </Appbar.Header>

          <KeyboardAwareScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            nestedScrollEnabled>
            <View style={profileFlowStyles.navigateSection}>
              <View style={signupStyles.imageContainer}>
                <TouchableOpacity
                  style={signupStyles.imageUpload}
                  onPress={() => {
                    setIsImagePickerVisible(true);
                  }}>
                  <View style={signupStyles.addImageContainer}>
                    {profileImage || user?.profileImage ? (
                      <Image
                        source={{ uri: profileImage ?? user?.profileImage }}
                        style={signupStyles.profileImage}
                      />
                    ) : (
                      <Image
                        source={require('@/assets/images/avatar.png')}
                        style={signupStyles.avatar}
                      />
                    )}
                    <View style={signupStyles.cameraIcon}>
                      <Icon
                        size={16}
                        source="camera"
                        color={Colors.light[10]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={profileFlowStyles.infoContainer}>
                <TextInput
                  mode="outlined"
                  value={formData.fullName}
                  onChangeText={text => handleInputChange('fullName', text)}
                  label={i18n.t(
                    '(farmer).(profile-flow).(personal-info).fullName',
                  )}
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey['e8'],
                      primary: Colors.primary[500],
                    },
                  }}
                  outlineColor={Colors.grey['bg']}
                  style={loginstyles.input}
                />

                <TextInput
                  mode="outlined"
                  value={formData.email}
                  onChangeText={text => handleInputChange('email', text)}
                  label={i18n.t(
                    '(farmer).(profile-flow).(personal-info).email',
                  )}
                  inputMode="email"
                  autoCapitalize="none"
                  theme={{
                    roundness: 15,
                    colors: {
                      onSurfaceVariant: Colors.grey['e8'],
                      primary: Colors.primary[500],
                    },
                  }}
                  outlineColor={Colors.grey['bg']}
                  style={loginstyles.input}
                />

                <View style={loginstyles.inputs}>
                  <GooglePlacesAutocomplete
                    keyboardShouldPersistTaps="always"
                    ref={googlePlacesAutoCompleteRef}
                    placeholder={i18n.t(
                      '(farmer).(profile-flow).(personal-info).address',
                    )}
                    fetchDetails={true}
                    onPress={handleAddressSelect}
                    query={{
                      key: process.env
                        .EXPO_PUBLIC_GOOGLE_PLACES_AUTOCOMPLETE_KEY,
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
                        maxHeight: 220,
                        zIndex: 99999,
                      },
                      row: {
                        flexWrap: 'wrap', // <- allow wrapping
                        paddingHorizontal: 10,
                        paddingVertical: 12,
                      },
                      description: {
                        flexWrap: 'wrap', // <- wrap text
                        fontSize: 14,
                        lineHeight: 18,
                      },
                    }}
                    renderRow={data => (
                      <View
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          overflowX: 'hidden',
                          width: 20,
                        }}>
                        <Text
                          style={{
                            flexShrink: 1,
                            flex: 1,
                            fontSize: 14,
                            lineHeight: 18,
                            color: Colors.grey['3c'],
                            flexWrap: 'wrap', // allow wrapping
                          }}
                          numberOfLines={0} // allow unlimited lines
                        >
                          {data.description}
                        </Text>
                      </View>
                    )}
                    textInputProps={{
                      placeholderTextColor: Colors.grey['3c'],
                      value: formData.address,
                      onChangeText: text => {
                        handleInputChange('address', text);
                        if (lastSelectedAddress && text !== lastSelectedAddress) {
                          setLastSelectedAddress(null);
                          handleInputChange('locationCoordinates', null);
                        }
                      },
                      onFocus: () => { },
                      onBlur: () => { },
                    }}
                    nearbyPlacesAPI="GooglePlacesSearch"
                    debounce={200}
                    timeout={20000}
                    minLength={3}
                    enablePoweredByContainer={false}
                    predefinedPlaces={[]}
                  />
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={hasChanges ? handleSave : () => { }}
          loading={loading}
          disabled={!hasChanges || loading}
          buttonColor={Colors.primary['500']}
          style={defaultStyles.button}>
          {i18n.t('(farmer).(profile-flow).(personal-info).save')}
        </Button>
      </View>

      <ImagePicker
        visible={isImagePickerVisible}
        setImage={handleImageSelect}
        onClose={() => {
          setIsImagePickerVisible(false);
        }}
        aspect={[1, 1]}
      />
      <Snackbar
        visible={!!error}
        onDismiss={() => { }}
        duration={3000}
        style={defaultStyles.snackbar}>
        <Text style={defaultStyles.errorText}>{errorMessage}</Text>
      </Snackbar>
      <Snackbar
        visible={isSuccess}
        onDismiss={() => { }}
        duration={3000}
        style={defaultStyles.successSnackBar}>
        <Text style={defaultStyles.primaryText}>
          {i18n.t('(farmer).(profile-flow).(personal-info).success')}
        </Text>
      </Snackbar>
    </>
  );
}
