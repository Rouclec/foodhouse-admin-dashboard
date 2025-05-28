# FoodHouse Features Checklist

## Infrastructure Changes
1. **Hosting Migration**
   - Current: AWS
   - Target: Render
   - Tasks:
     - Set up Render infrastructure
     - Migrate databases
     - Update DNS configurations
     - Test deployment pipeline
   - Status: ⏳ TODO

2. **Tanzania Expansion**
   - Requirements:
     - Integrate Tanzanian SMS service
     - Integrate Tanzanian payment gateway
     - Update phone number validation
     - Update currency handling
   - Status: ⏳ TODO

## Backend Features

### User Service

#### Authentication
1. **Signup SMS OTP**
   - Endpoint: `/v1/users/public/send-signupsmsotp`
   - Method: POST
   - Description: Sends an OTP to the user's phone number during signup process
   - Request: `{ phone_number: string, intent: OTP_INTENT_SIGNUP }`
   - Status: 🚧 In Progress - Still configuring the SMS service

2. **Verify OTP**
   - Endpoint: `/v1/users/public/verify-otp`
   - Method: POST
   - Description: Verifies the OTP entered by user matches the sent OTP
   - Request: `{ type: FACTOR_TYPE_SMS_OTP, id: string, secret_value: string }`
   - Status: ✅ Implemented

3. **User Signup**
   - Endpoint: `/v1/users/public/signup`
   - Method: POST
   - Description: Creates a new user account after OTP verification
   - Request: `{ phone_factor: AuthFactor, residence_country_iso_code: string, password: string, user_type: UserType, email: string }`
   - Status: ✅ Implemented

4. **Login**
   - Endpoint: `/v1/users/public/authenticate`
   - Method: POST
   - Description: Authenticates user with phone/password or OTP
   - Request: `{ factors: AuthFactor[] }`
   - Response: `{ login_complete: boolean, additional_factor?: AdditionalFactor, tokens?: Tokens }`
   - Status: ✅ Implemented

5. **Refresh Token**
   - Endpoint: `/v1/users/refresh-access-token`
   - Method: POST
   - Description: Generates new access token using refresh token
   - Request: `{ refresh_token: string }`
   - Status: ✅ Implemented

4. **Signup EMAIL OTP**
   - Endpoint: `/v1/users/public/send-signupsmsotp`
   - Method: POST
   - Description: Sends an OTP to the user's email during forgot password process (They will have to verify this otp using the verify email endpoint)
   - Request: `{ email: string, intent: OTP_INTENT_RESET_PASSWORD }`
   - Status: 🚧 In Progress - Still configuring the Email service

5. **Change Password**
   - Endpoint: `/v1/users/change-password`
   - Method: POST
   - Description: Changes user password with email verification
   - Request: `{ new_password: string, email_factor: AuthFactor }`
   - Status: ✅ Implemented

#### User Profile Management
1. **Complete Registration**
   - Endpoint: `/v1/users/{user_id}/complete-registration`
   - Method: POST
   - Description: Completes user profile with additional information
   - Request: `{ first_name: string, last_name: string, email: string, address: string, profile_image: string, location_coordinates: Point }`
   - Status: ✅ Implemented

2. **Get User Details**
   - Endpoint: `/v1/users/{user_id}/get-user`
   - Method: GET
   - Description: Retrieves user profile information
   - Response: `{ user: User }`
   - Status: ✅ Implemented

#### Subscription Management
1. **Create Subscription Plan**
   - Endpoint: `/v1/admin/{user_id}/products/create-subscription`
   - Method: POST
   - Description: Creates a new subscription plan (Admin only)
   - Request: `{ title: string, description: string, duration: number, amount: number, currency_iso_code: string }`
   - Status: ✅ Implemented

2. **Subscribe User**
   - Endpoint: `/v1/users/{user_id}/subscribe`
   - Method: POST
   - Description: Subscribes a user to a plan
   - Request: `{ subscription_id: string, payment_method: PaymentMethod }`
   - Status: ✅ Implemented

3. **Get User Subscriptions**
   - Endpoint: `/v1/users/{user_id}/subscriptions`
   - Method: GET
   - Description: Lists all subscriptions for a user
   - Response: `{ subscriptions: UserSubscription[] }`
   - Status: ✅ Implemented

### Product Service

#### Category Management
1. **Create Category**
   - Endpoint: `/v1/admin/{user_id}/products/create-category`
   - Method: POST
   - Description: Creates a new product category (Admin only)
   - Request: `{ name: string }`
   - Status: ✅ Implemented

2. **List Categories**
   - Endpoint: `/v1/public/products/get-categories`
   - Method: GET
   - Description: Lists all available product categories
   - Response: `{ categories: Category[] }`
   - Status: ✅ Implemented

#### Product Management
1. **Create Product**
   - Endpoint: `/v1/users/{user_id}/products/create-product`
   - Method: POST
   - Description: Creates a new product listing
   - Request: `{ category_id: string, name: string, unit_type: string, amount: Amount, description: string, image: string, whole_sale: boolean }`
   - Status: ✅ Implemented

2. **Update Product**
   - Endpoint: `/v1/users/{user_id}/products/{product_id}/update-product`
   - Method: PUT
   - Description: Updates existing product information
   - Request: `{ category_id: string, name: string, unit_type: string, amount: Amount, description: string, image: string, whole_sale: boolean }`
   - Status: ✅ Implemented

3. **List Products**
   - Endpoint: `/v1/public/products/list-products`
   - Method: GET
   - Description: Lists products with filtering options
   - Query Params: `{ category_id?: string, min_amount?: Amount, max_amount?: Amount, search?: string, start_key?: string, count?: number }`
   - Status: ✅ Implemented

4. **Get Product Details**
   - Endpoint: `/v1/public/products/{product_id}/get-product`
   - Method: GET
   - Description: Retrieves detailed information about a specific product
   - Response: `{ product: Product }`
   - Status: ✅ Implemented

### Order Service

#### Order Management
1. **Create Order**
   - Endpoint: `/v1/{user_id}/orders/create-order`
   - Method: POST
   - Description: Creates a new order with delivery details
   - Request: `{ order: Order, phone_number: string }`
   - Status: ✅ Implemented

2. **Get Order Details**
   - Endpoint: `/v1/{user_id}/order/{order_number}/get-order-details`
   - Method: GET
   - Description: Retrieves order information and audit logs
   - Response: `{ order: Order, audit_log: OrderAuditLog[] }`
   - Status: ✅ Implemented

3. **List User Orders**
   - Endpoint: `/v1/{user_id}/orders/list-user-orders`
   - Method: GET
   - Description: Lists all orders for a user
   - Query Params: `{ count: number, start_key?: string }`
   - Status: ✅ Implemented

4. **List Farmer Orders**
   - Endpoint: `/v1/{farmer_id}/orders/list-farmer-orders`
   - Method: GET
   - Description: Lists all orders for a farmer
   - Query Params: `{ count: number, start_key?: string }`
   - Status: ✅ Implemented

#### Order Processing
1. **Confirm Order Payment**
   - Endpoint: `/v1/public/confirm-order-payment`
   - Method: GET
   - Description: Webhook endpoint for payment confirmation from CamPay
   - Query Params: `{ status: string, reference: string, amount: string, currency: string, operator: string, code: string, operator_reference: string, signature: string, endpoint: string, external_reference: string, phone_number: string }`
   - Status: ✅ Implemented

2. **Dispatch Order**
   - Endpoint: `/v1/{user_id}/orders/{order_number}/dispatch-order`
   - Method: PUT
   - Description: Marks an order as dispatched by the farmer (or the delivery agent)
   - Request: `{}`
   - Status: ✅ Implemented

3. **Confirm Delivery**
   - Endpoint: `/v1/{user_id}/orders/{secret_key}/confirm-delivery`
   - Method: PUT
   - Description: Confirms order delivery using secret key
   - Request: `{}`
   - Status: ✅ Implemented

### Third-Party Integrations

#### SMS Service
1. **Send SMS OTP**
   - Endpoint: `/v1/users/public/send-smsotp`
   - Method: POST
   - Description: Sends OTP via SMS for various purposes (login, reset password)
   - Request: `{ phone_number: string, intent: OtpIntent }`
   - Status: ✅ Implemented

#### Payment Service (CamPay)
1. **Payment Confirmation Webhook**
   - Endpoint: `/v1/public/confirm-order-payment`
   - Method: GET
   - Description: Receives payment status updates from CamPay
   - Query Params: Various payment details and verification signature
   - Status: ✅ Implemented

### Delivery Points Service
1. **Create Delivery Point**
   - Endpoint: `/v1/admin/{user_id}/delivery-points/create`
   - Method: POST
   - Description: Creates a new delivery point
   - Request: `{ 
     name: string,
     region: string,
     city: string,
     address: string,
     coordinates: Point,
     is_active: boolean,
     operating_hours: string,
     contact_number: string
   }`
   - Status: ⏳ TODO

2. **List Delivery Points**
   - Endpoint: `/v1/public/delivery-points/list`
   - Method: GET
   - Description: Lists all delivery points with filtering options
   - Query Params: `{ 
     region?: string,
     city?: string,
     is_active?: boolean,
     search?: string
   }`
   - Status: ⏳ TODO

3. **Get Delivery Points by Region**
   - Endpoint: `/v1/public/delivery-points/region/{region}`
   - Method: GET
   - Description: Lists delivery points in a specific region
   - Response: `{ delivery_points: DeliveryPoint[] }`
   - Status: ⏳ TODO

4. **Update Delivery Point**
   - Endpoint: `/v1/admin/{user_id}/delivery-points/{point_id}/update`
   - Method: PUT
   - Description: Updates delivery point information
   - Request: `{ 
     name?: string,
     address?: string,
     coordinates?: Point,
     is_active?: boolean,
     operating_hours?: string,
     contact_number?: string
   }`
   - Status: ⏳ TODO

5. **Delete Delivery Point**
   - Endpoint: `/v1/admin/{user_id}/delivery-points/{point_id}/delete`
   - Method: DELETE
   - Description: Deactivates a delivery point
   - Status: `{ message: string }`
   - Status: ⏳ TODO

## Mobile App Features

### Authentication & Onboarding
1. **Onboarding Screens**
   - Screens: `(auth)/onboarding.tsx`
   - Description: Displays app introduction slides with key features
   - Features:
     - Animated slides with images and descriptions
     - Progress indicators
     - Get Started button
   - Status: ✅ Implemented

2. **Login Screen**
   - Screens: `(auth)/login.tsx`
   - Description: Handles user authentication
   - Features:
     - Phone number input
     - OTP verification
     - Password login option
     - Forgot password flow
   - Status: 🚧 In Progress

3. **Registration Screen**
   - Screens: `(auth)/register.tsx`
   - Description: New user registration process
   - Features:
     - Phone number verification
     - OTP confirmation
     - User type selection (Farmer/Buyer)
     - Basic profile setup
   - Status: 🚧 In Progress

4. **Profile Completion**
   - Screens: `(auth)/complete-profile.tsx`
   - Description: Collects additional user information
   - Features:
     - Personal details input
     - Address information
     - Profile picture upload
     - Location selection
   - Status: 🚧 In Progress

### Product Features
1. **Product Listing**
   - Screens: `(app)/products/index.tsx`
   - Description: Displays available products
   - Features:
     - Category-based filtering
     - Price range filtering
     - Search functionality
     - Infinite scroll
   - Status: 🚧 In Progress

2. **Product Details**
   - Screens: `(app)/products/[id].tsx`
   - Description: Shows detailed product information
   - Features:
     - Product images
     - Price and unit information
     - Seller details
     - Add to cart
     - Buy now option
   - Status: 🚧 In Progress

3. **Farmer Dashboard**
   - Screens: `(app)/farmer/dashboard.tsx`
   - Description: Farmer's product management interface
   - Features:
     - Product listing
     - Add new product
     - Edit existing products
     - Sales analytics
   - Status: 🚧 In Progress

### Order Features
1. **Cart Management**
   - Screens: `(app)/cart.tsx`
   - Description: Shopping cart interface
   - Features:
     - Product quantity adjustment
     - Price calculation
     - Checkout process
   - Status: 🚧 In Progress

2. **Order Creation**
   - Screens: `(app)/checkout.tsx`
   - Description: Order placement process
   - Features:
     - Delivery location selection
     - Payment method selection
     - Order confirmation
   - Status: 🚧 In Progress

3. **Order Tracking**
   - Screens: `(app)/orders/[id].tsx`
   - Description: Order status and tracking
   - Features:
     - Order status updates
     - Delivery tracking
     - Delivery confirmation
   - Status: 🚧 In Progress

4. **Order History**
   - Screens: `(app)/orders/index.tsx`
   - Description: List of user's orders
   - Features:
     - Order list with status
     - Order details view
     - Order filtering
   - Status: 🚧 In Progress

### User Features
1. **Profile Management**
   - Screens: `(app)/profile/index.tsx`
   - Description: User profile management
   - Features:
     - Personal information
     - Address management
     - Payment methods
     - Profile picture
   - Status: 🚧 In Progress

2. **Subscription Management**
   - Screens: `(app)/subscription/index.tsx`
   - Description: Subscription plan management
   - Features:
     - Available plans
     - Current subscription
     - Payment history
   - Status: 🚧 In Progress

### Additional Features
1. **Notifications**
   - Screens: `(app)/notifications.tsx`
   - Description: User notifications center
   - Features:
     - Order updates
     - Payment confirmations
     - Delivery updates
   - Status: 🚧 In Progress

2. **Location Services**
   - Screens: Various screens with location features
   - Description: Location-based features
   - Features:
     - Delivery location selection
     - Nearby products
     - Location-based filtering
   - Status: 🚧 In Progress

3. **Reviews & Ratings**
   - Screens: `(app)/reviews/[id].tsx`
   - Description: Product and seller reviews
   - Features:
     - Product reviews
     - Seller ratings
     - Review submission
   - Status: 🚧 In Progress

### Delivery Features
1. **Delivery Point Selection**
   - Screens: `(app)/checkout/delivery.tsx`
   - Description: Delivery method and point selection
   - Features:
     - Home delivery option
     - Delivery point selection
     - Region-based filtering
     - City-based filtering
     - Map view of delivery points
     - Delivery cost calculation
   - Status: 🚧 In Progress

2. **Order Delivery Tracking**
   - Screens: `(app)/orders/[id]/delivery.tsx`
   - Description: Enhanced order tracking with delivery point information
   - Features:
     - Delivery point details
     - Operating hours
     - Contact information
     - Pickup instructions
   - Status: 🚧 In Progress

### Regional Support
1. **Location Services**
   - Screens: Various screens with location features
   - Description: Enhanced location-based features
   - Features:
     - Region detection
     - City detection
     - Nearby delivery points
     - Region-specific pricing
   - Status: 🚧 In Progress

2. **Multi-Country Support**
   - Screens: Various screens
   - Description: Support for multiple countries
   - Features:
     - Country selection
     - Region/city mapping
     - Currency conversion
     - Local payment methods
   - Status: ⏳ Planned

### Admin Dashboard Service
1. **Admin Authentication**
   - Endpoint: `/v1/users/public/authenticate`
   - Method: POST
   - Description: Admin-specific authentication
   - Request: `{ email: string, password: string }`
   - Status: ⏳ TODO

2. **Dashboard Statistics**
   - Endpoint: `/v1/admin/dashboard/statistics`
   - Method: GET
   - Description: Get overall platform statistics
   - Response: `{ 
     total_users: number,
     total_orders: number,
     total_products: number,
     revenue: Amount,
     active_farmers: number,
     pending_orders: number
   }`
   - Status: ⏳ TODO

3. **User Management**
   - Endpoint: `/v1/admin/users`
   - Method: GET
   - Description: List and manage users
   - Query Params: `{ 
     user_type?: UserType,
     search?: string,
     start_key?: string,
     count?: number
   }`
   - Status: ⏳ TODO

4. **Order Management**
   - Endpoint: `/v1/admin/orders`
   - Method: GET
   - Description: List and manage all orders
   - Query Params: `{ 
     status?: OrderStatus,
     start_date?: string,
     end_date?: string,
     start_key?: string,
     count?: number
   }`
   - Status: ⏳ TODO

5. **Delivery Point Management**
   - Endpoint: `/v1/admin/delivery-points`
   - Method: GET
   - Description: List and manage delivery points
   - Query Params: `{ 
     region?: string,
     city?: string,
     is_active?: boolean
   }`
   - Status: ⏳ TODO

6. **Subscription Management**
   - Endpoint: `/v1/admin/subscriptions`
   - Method: GET
   - Description: List and manage subscription plans
   - Status: ⏳ TODO

### Confirmation App Service
1. **Agent Authentication**
   - Endpoint: `/v1/users/public/authenticate`
   - Method: POST
   - Description: Agent-specific authentication
   - Request: `{ phone_number: string, password: string }`
   - Status: ⏳ TODO

2. **List Pending Confirmations**
   - Endpoint: `/v1/agent/confirmations/pending`
   - Method: GET
   - Description: List orders pending confirmation
   - Query Params: `{ 
     city?: string,
     start_key?: string,
     count?: number
   }`
   - Status: ⏳ TODO

3. **Confirm Order**
   - Endpoint: `/v1/agent/orders/{order_number}/confirm`
   - Method: POST
   - Description: Confirm order quality and initiate payment
   - Request: `{ 
     quality_check: boolean,
     notes?: string,
     images?: string[]
   }`
   - Status: ⏳ TODO

4. **Dispatch Order**
   - Endpoint: `/v1/agent/orders/{order_number}/dispatch`
   - Method: POST
   - Description: Dispatch confirmed order to delivery point
   - Request: `{ 
     delivery_point_id: string,
     estimated_arrival: string,
     notes?: string
   }`
   - Status: ⏳ TODO

5. **Agent Statistics**
   - Endpoint: `/v1/agent/statistics`
   - Method: GET
   - Description: Get agent performance statistics
   - Response: `{ 
     total_confirmations: number,
     total_dispatches: number,
     average_confirmation_time: number,
     quality_issues: number
   }`
   - Status: ⏳ TODO

## Web Applications

### Admin Dashboard
1. **Dashboard Overview**
   - Pages: `/admin/dashboard`
   - Description: Main admin dashboard
   - Features:
     - Key statistics
     - Recent activities
     - Quick actions
     - Notifications
   - Status: ⏳ TODO

2. **User Management**
   - Pages: `/admin/users`
   - Description: User management interface
   - Features:
     - User listing
     - User details
     - User actions
     - Search and filter
   - Status: ⏳ TODO

3. **Order Management**
   - Pages: `/admin/orders`
   - Description: Order management interface
   - Features:
     - Order listing
     - Order details
     - Order status updates
     - Search and filter
   - Status: ⏳ TODO

4. **Delivery Point Management**
   - Pages: `/admin/delivery-points`
   - Description: Delivery point management
   - Features:
     - Point listing
     - Add/Edit points
     - Region management
     - Status updates
   - Status: ⏳ TODO

5. **Subscription Management**
   - Pages: `/admin/subscriptions`
   - Description: Subscription plan management
   - Features:
     - Plan listing
     - Create/Edit plans
     - User subscriptions
     - Revenue tracking
   - Status: ⏳ TODO

6. **Reports & Analytics**
   - Pages: `/admin/analytics`
   - Description: Business intelligence dashboard
   - Features:
     - Sales reports
     - User growth
     - Revenue analytics
     - Export functionality
   - Status: ⏳ TODO


Legend:
- ✅ Implemented
- 🚧 In Progress
- ⏳ TODO
- ❌ Not Started 