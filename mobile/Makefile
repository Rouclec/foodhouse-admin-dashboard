lint: 
	npx eslint .

fix-lint: 
	npx eslint . --fix

test: 
	yarn test -u

e2e-test:
	LOG_FILE="e2e_test_reports/test-output-$(shell date +%Y-%m-%d_%H%M%S).txt" && \
	maestro test e2e_tests/01_signup_test.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 01_signup_test completed ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/02_verify_sms_otp.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 02_verify_sms_otp completed ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/02.1_verify_id_test.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 02.1_verify_id completed ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/03_tabs_screen_test.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 03_tabs_screen_test completed ----\n\n\n" >> $$LOG_FILE && \
	echo "---- Omiting 04_update_profile_test since the user profile is already updated ----\n\n\n" >> $$LOG_FILE && \
	echo "---- Omiting 05_verify_email_otp_test since the user profile is already updated ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/06_select_destination_country.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow  06_select_destination_country completed ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/07_payment_method_test.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 07_payment_method_test completed ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/08_recipient_details_test.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 08_recipient_details_test completed ----\n\n\n" >> $$LOG_FILE && \
	maestro test e2e_tests/09_input_amount_test.yaml >> $$LOG_FILE 2>&1 && \
	echo "---- Flow 09_input_amount_test completed ----\n\n\n" >> $$LOG_FILE

	# maestro test e2e_tests/04_update_profile_test.yaml >> $$LOG_FILE 2>&1 && \
	# echo "---- Flow 04_update_profile_test completed ----\n\n\n" >> $$LOG_FILE && \
	# maestro test e2e_tests/05_verify_email_otp_test.yaml >> $$LOG_FILE 2>&1 && \
	# echo "---- Flow 05_verify_email_otp_test completed ----\n\n\n" >> $$LOG_FILE && \

run: 
	yarn start

run-android:
	yarn start --android

run-ios: 
	yarn start --ios

install:
	yarn install

build-and-test-android: 
	eas build --profile build-and-maestro-test --platform android $(FLAGS)

dev-build:
	eas build --profile development --platform $(PLATFORM) $(FLAGS)
