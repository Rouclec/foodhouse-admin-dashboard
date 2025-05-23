import { Colors } from '@/constants';
import { DatePickerStyles as styles } from '@/styles';
import moment from 'moment';
import React, { Dispatch, FC, SetStateAction, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Icon } from 'react-native-paper';

type Props = {
  placeholder: string;
  date: Date | undefined;
  setDate: Dispatch<SetStateAction<Date | undefined>>;
  minimumDate?: Date;
  maximumDate?: Date;
};

const DatePicker: FC<Props> = ({
  placeholder,
  date,
  setDate,
  minimumDate,
  maximumDate,
}) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    setDate(date);
    hideDatePicker();
  };

  return (
    <View>
      <TouchableOpacity onPress={showDatePicker} style={styles.buttonContainer}>
        {date ? (
          <Text style={styles.text}>{moment(date).format('DD/MM/YYYY')}</Text>
        ) : (
          <Text style={styles.placeholder}>{placeholder ?? 'Select date'}</Text>
        )}
        <Icon source={'calendar'} size={24} color={Colors.primary['300']} />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        maximumDate={maximumDate ? maximumDate : undefined}
        minimumDate={minimumDate ? minimumDate : undefined}
      />
    </View>
  );
};

export default DatePicker;
