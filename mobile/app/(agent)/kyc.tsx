import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Appbar, Text, Button, Icon } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { kycStyles, defaultStyles } from '@/styles';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { agentDemoState } from '@/contexts/AgentContext';
import { demoConfig } from '@/constants/demo';
import { Context, type ContextType } from '@/app/_layout';
import {
  usersCreateKycMutation,
  usersGetKycByUserIdOptions,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { uploadImage } from '@/utils';
import type { usersgrpcKYCStatus } from '@/client/users.swagger';

interface DocumentState {
  uri: string;
  name?: string;
  type?: string;
}

type KycUiStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

function mapGrpcKycStatusToUi(status?: usersgrpcKYCStatus): KycUiStatus {
  switch (status) {
    case 'KYC_STATUS_VERIFIED':
      return 'verified';
    case 'KYC_STATUS_REJECTED':
      return 'rejected';
    case 'KYC_STATUS_PENDING':
      return 'pending';
    default:
      return 'pending';
  }
}

const KYC = () => {
  const [agentState, setAgentState] = useState(agentDemoState.getState());
  const [identityDocumentFront, setIdentityDocumentFront] =
    useState<DocumentState | null>(null);
  const [identityDocumentBack, setIdentityDocumentBack] =
    useState<DocumentState | null>(null);
  const [selfie, setSelfie] = useState<DocumentState | null>(null);
  const [vehicleDocument, setVehicleDocument] = useState<DocumentState | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useContext(Context) as ContextType;
  const userId = user?.userId ?? '';
  const isDemoMode = agentState.isDemoMode;

  useEffect(() => {
    const unsubscribe = agentDemoState.subscribe(setAgentState);
    return () => { unsubscribe(); };
  }, []);

  const { data: backendKycData } = useQuery({
    ...usersGetKycByUserIdOptions({
      path: { userId },
    }),
    enabled: !!userId && !isDemoMode,
  });

  const backendKycStatus: KycUiStatus = useMemo(() => {
    const verification = backendKycData?.kycVerification;
    if (!verification) return 'not_started';
    return mapGrpcKycStatusToUi(verification.status);
  }, [backendKycData?.kycVerification]);

  const kycStatus: KycUiStatus = isDemoMode
    ? (agentState.kycStatus as KycUiStatus)
    : backendKycStatus;

  const { mutateAsync: createKyc } = useMutation({
    ...usersCreateKycMutation(),
  });

  const uploadKycFile = async (params: {
    uri: string;
    filename: string;
    directory?: string;
  }): Promise<string> => {
    return await uploadImage({
      uri: params.uri,
      filename: params.filename,
      directory: params.directory ?? 'kyc',
    });
  };

  const pickImage = async (
    setImage: React.Dispatch<React.SetStateAction<DocumentState | null>>,
  ) => {
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        i18n.t('components.ImagePicker.permissionDenied'),
        i18n.t('components.ImagePicker.allowAccessToGallery'),
      );
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || 'image.jpg',
        type: result.assets[0].type || 'image',
      });
    }
  };

  const takePhoto = async (
    setImage: React.Dispatch<React.SetStateAction<DocumentState | null>>,
  ) => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        i18n.t('components.ImagePicker.permissionDenied'),
        i18n.t('components.ImagePicker.allowAccessToCamera'),
      );
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || 'photo.jpg',
        type: result.assets[0].type || 'image',
      });
    }
  };

  const pickVehicleDocument = async (
    setDocument: React.Dispatch<React.SetStateAction<DocumentState | null>>,
  ) => {
    Alert.alert(i18n.t('(agent).kyc.selectDocument'), '', [
      {
        text: i18n.t('components.ImagePicker.camera'),
        onPress: async () => {
          const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              i18n.t('components.ImagePicker.permissionDenied'),
              i18n.t('components.ImagePicker.allowAccessToCamera'),
            );
            return;
          }
          const result = await ExpoImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setDocument({
              uri: result.assets[0].uri,
              name: result.assets[0].fileName || 'vehicle.jpg',
              type: 'image',
            });
          }
        },
      },
      {
        text: i18n.t('components.ImagePicker.photoGalery'),
        onPress: async () => {
          const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              i18n.t('components.ImagePicker.permissionDenied'),
              i18n.t('components.ImagePicker.allowAccessToGallery'),
            );
            return;
          }
          const result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setDocument({
              uri: result.assets[0].uri,
              name: result.assets[0].fileName || 'vehicle.jpg',
              type: 'image',
            });
          }
        },
      },
      {
        text: i18n.t('(agent).kyc.uploadPdf'),
        onPress: async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf'],
              copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setDocument({
                uri: asset.uri,
                name: asset.name,
                type: 'application/pdf',
              });
            }
          } catch (error) {
            console.error('Error picking PDF:', error);
          }
        },
      },
      {
        text: i18n.t('components.ImagePicker.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const showImageOptions = (
    setImage: React.Dispatch<React.SetStateAction<DocumentState | null>>,
  ) => {
    Alert.alert(i18n.t('components.ImagePicker.photoGalery'), '', [
      {
        text: i18n.t('components.ImagePicker.camera'),
        onPress: () => takePhoto(setImage),
      },
      {
        text: i18n.t('components.ImagePicker.photoGalery'),
        onPress: () => pickImage(setImage),
      },
      {
        text: i18n.t('components.ImagePicker.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const handleSubmit = async () => {
    if (
      !identityDocumentFront ||
      !identityDocumentBack ||
      !selfie ||
      !vehicleDocument
    ) {
      Alert.alert(
        i18n.t('(agent).kyc.missingDocuments'),
        i18n.t('(agent).kyc.uploadAllDocuments'),
      );
      return;
    }

    setLoading(true);
    try {
      // Demo mode: keep existing mock behavior.
      if (isDemoMode) {
        if (!demoConfig.enabled) {
          Alert.alert(
            i18n.t('common.error'),
            i18n.t('(agent).kyc.demoDisabled'),
          );
          return;
        }

        agentDemoState.loginAsAgent(true);
        agentDemoState.submitKYC();
        setSubmitted(true);
        router.replace('/(agent)/(index)');
        return;
      }

      if (!userId) {
        Alert.alert(i18n.t('common.error'), i18n.t('(agent).kyc.missingSession'));
        return;
      }

      const now = Date.now();
      const idFrontUrl = await uploadKycFile({
        uri: identityDocumentFront.uri,
        filename: `kyc_${userId}_identity_${now}.jpg`,
      });
      const idBackUrl = await uploadKycFile({
        uri: identityDocumentBack.uri,
        filename: `kyc_${userId}_identity_back_${now}.jpg`,
      });
      const selfieUrl = await uploadKycFile({
        uri: selfie.uri,
        filename: `kyc_${userId}_selfie_${now}.jpg`,
      });

      const vehicleExt =
        (vehicleDocument.type === 'application/pdf' ? 'pdf' : 'jpg') as
          | 'pdf'
          | 'jpg';
      const vehicleUrl = await uploadKycFile({
        uri: vehicleDocument.uri,
        filename: `kyc_${userId}_vehicle_${now}.${vehicleExt}`,
      });

      await createKyc({
        path: { userId },
        body: {
          // New array-based fields
          identityDocumentUrls: [idFrontUrl, idBackUrl],
          selfieUrls: [selfieUrl],
          vehicleDocumentUrls: [vehicleUrl],

          // Back-compat fields (server still supports these)
          identityDocumentUrl: idFrontUrl,
          selfieUrl,
          vehicleDocumentUrl: vehicleUrl,
        },
      });

      setSubmitted(true);
      router.replace('/(agent)/(index)');
    } catch (error) {
      console.error('Error submitting KYC:', error);
      Alert.alert(
        i18n.t('(auth).login.anUnknownError'),
        i18n.t('(agent).kyc.submitError'),
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    identityDocumentFront &&
    identityDocumentBack &&
    selfie &&
    vehicleDocument;

  const isSubmitDisabled = loading || !isFormValid;

  if (submitted || kycStatus === 'verified') {
    return (
      <View style={[defaultStyles.flex, defaultStyles.container]}>
        <View style={kycStyles.successContainer}>
          <View style={kycStyles.successIcon}>
            <Icon source="check-circle" size={64} color={Colors.primary[500]} />
          </View>
          <Text style={kycStyles.successTitle}>
            {kycStatus === 'verified' 
              ? i18n.t('(agent).kyc.verifiedTitle')
              : i18n.t('(agent).kyc.submittedTitle')}
          </Text>
          <Text style={kycStyles.successMessage}>
            {kycStatus === 'verified'
              ? i18n.t('(agent).kyc.verifiedMessage')
              : i18n.t('(agent).kyc.submittedMessage')}
          </Text>
          
          {isDemoMode && agentState.kycStatus === 'pending' && (
            <View style={{ marginTop: 24, padding: 16, backgroundColor: Colors.primary[50], borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary[500], marginBottom: 8 }}>
                {i18n.t('(agent).kyc.demoActiveTitle')}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.grey['61'] }}>
                {i18n.t('(agent).kyc.autoApproveMessage')}
              </Text>
              <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon source="loading" size={20} color={Colors.primary[500]} />
                <Text style={{ marginLeft: 8, color: Colors.primary[500] }}>
                  {i18n.t('(agent).kyc.processing')}
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={() => router.replace('/(agent)/(index)')}
            style={defaultStyles.button}
            buttonColor={Colors.primary[500]}>
            {i18n.t('(agent).kyc.continueToDashboard')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[defaultStyles.flex, defaultStyles.container]}>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={defaultStyles.heading}>
          {i18n.t('(agent).kyc.title')}
        </Text>
        <View />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={kycStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={{ 
          backgroundColor: Colors.primary[50], 
          padding: 12, 
          borderRadius: 8, 
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Icon source="information" size={20} color={Colors.primary[500]} />
          <Text style={{ marginLeft: 8, fontSize: 12, color: Colors.primary[500], flex: 1 }}>
            {i18n.t('(agent).kyc.subtitle')}
          </Text>
        </View>

        <View style={kycStyles.documentCard}>
          <Text style={kycStyles.documentTitle}>
            {i18n.t('(agent).kyc.identityDocument')}
          </Text>
          <Text style={kycStyles.documentDescription}>
            {i18n.t('(agent).kyc.identityDocumentDesc')}
          </Text>

          <View style={kycStyles.idContainer}>
            <View style={kycStyles.idHalf}>
              <Text style={kycStyles.idLabel}>
                {i18n.t('(agent).kyc.front')}
              </Text>
              <TouchableOpacity
                style={kycStyles.imageContainer}
                onPress={() => showImageOptions(setIdentityDocumentFront)}>
                {identityDocumentFront ? (
                  <Image
                    source={{ uri: identityDocumentFront.uri }}
                    style={kycStyles.uploadedImage}
                  />
                ) : (
                  <View style={kycStyles.imagePlaceholder}>
                    <Icon source="camera" size={32} color={Colors.grey['61']} />
                    <Text style={kycStyles.placeholderText}>
                      {i18n.t('(agent).kyc.uploadPhoto')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

          <View style={kycStyles.idHalf}>
            <Text style={kycStyles.idLabel}>
              {i18n.t('(agent).kyc.back')}
            </Text>
            <TouchableOpacity
              style={kycStyles.imageContainer}
              onPress={() => showImageOptions(setIdentityDocumentBack)}>
              {identityDocumentBack ? (
                <Image
                  source={{ uri: identityDocumentBack.uri }}
                  style={kycStyles.uploadedImage}
                />
              ) : (
                <View style={kycStyles.imagePlaceholder}>
                  <Icon source="camera" size={32} color={Colors.grey['61']} />
                  <Text style={kycStyles.placeholderText}>
                    {i18n.t('(agent).kyc.uploadPhoto')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </View>

        <View style={kycStyles.documentCard}>
          <Text style={kycStyles.documentTitle}>
            {i18n.t('(agent).kyc.selfie')}
          </Text>
          <Text style={kycStyles.documentDescription}>
            {i18n.t('(agent).kyc.selfieDesc')}
          </Text>
          <TouchableOpacity
            style={kycStyles.imageContainer}
            onPress={() => showImageOptions(setSelfie)}>
            {selfie ? (
              <Image
                source={{ uri: selfie.uri }}
                style={kycStyles.uploadedImage}
              />
            ) : (
              <View style={kycStyles.imagePlaceholder}>
                <Icon source="camera" size={32} color={Colors.grey['61']} />
                <Text style={kycStyles.placeholderText}>
                  {i18n.t('(agent).kyc.takePhoto')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={kycStyles.documentCard}>
          <Text style={kycStyles.documentTitle}>
            {i18n.t('(agent).kyc.vehicleDocument')}
          </Text>
          <Text style={kycStyles.documentDescription}>
            {i18n.t('(agent).kyc.vehicleDocumentDesc')}
          </Text>
          <TouchableOpacity
            style={kycStyles.imageContainer}
            onPress={() => pickVehicleDocument(setVehicleDocument)}>
            {vehicleDocument ? (
              vehicleDocument.type === 'application/pdf' ? (
                <View style={kycStyles.pdfPlaceholder}>
                  <Icon source="file-pdf-box" size={48} color={Colors.error} />
                  <Text style={kycStyles.placeholderText} numberOfLines={2}>
                    {vehicleDocument.name}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: vehicleDocument.uri }}
                  style={kycStyles.uploadedImage}
                />
              )
            ) : (
              <View style={kycStyles.imagePlaceholder}>
                <Icon source="file-upload" size={32} color={Colors.grey['61']} />
                <Text style={kycStyles.placeholderText}>
                  {i18n.t('(agent).kyc.uploadDocument')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      {isDemoMode && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: Colors.gold + '20', borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: Colors.grey['61'], textAlign: 'center' }}>
              Demo Mode: KYC will auto-approve after submission.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={defaultStyles.button}
          buttonColor={isSubmitDisabled ? Colors.grey['bg'] : Colors.primary[500]}
          loading={loading}
          disabled={isSubmitDisabled}>
          <Text style={defaultStyles.buttonText}>
            {i18n.t('(agent).kyc.submit')}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default KYC;
