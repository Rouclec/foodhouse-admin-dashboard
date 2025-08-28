import RNHTMLtoPDF from "react-native-html-to-pdf";
import * as Sharing from "expo-sharing";
import parsePhoneNumberFromString from "libphonenumber-js";

interface DispatchFormProps {
  orderId: string;
  quantity: string;
  unit: string;
  deliveryLocation: string;
  farmerName: string;
  farmerAddress: string;
  buyerName: string;
  buyerPhone: string;
  agentName: string;
  agentPhone: string;
}

export const generateDispatchFormPdf = async (props: DispatchFormProps) => {
  const {
    orderId,
    quantity,
    unit,
    deliveryLocation,
    farmerName,
    farmerAddress,
    buyerName,
    buyerPhone,
    agentName,
    agentPhone,
  } = props;

  const FOODHOUSE_PHONE = process.env.EXPO_PUBLIC_PHONE_NUMBER;
  const FOODHOUSE_EMAIL = process.env.EXPO_PUBLIC_EMAIL;

  const htmlContent = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Foodhouse Dispatch Receipt</title>
        <style>
          body {
            font-family: sans-serif;
            background: #f4f4f4;
            padding: 2rem;
            margin: 0;
          }

          .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .receipt-inner {
            padding: 2rem;
          }

          .header {
            text-align: center;
          }

          .logocircle {
            width: 80px;
            height: 80px;
            background-color: #2e7d32;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.75rem;
          }

          .logotext {
            color: #fff;
            font-weight: bold;
            font-size: 0.9rem;
            text-align: center;
            line-height: 1.2;
          }

          .header h2 {
            margin: 0.25rem 0;
            font-size: 1.4rem;
          }

          .section {
            margin-top: 2rem;
          }

          .section-title {
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 0.5rem;
          }

          .info-row {
            margin-bottom: 0.5rem;
          }

          .info-row span {
            display: block;
            color: #555;
          }

          .info-row strong {
            color: #222;
          }

          .footer {
            background-color: #2e7d32;
            color: #fff;
            display: flex;
            justify-content: space-between;
            padding: 1rem 2rem;
            font-size: 14px;
          }

          .footer div {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-inner">
            <div class="header">
              <div class="logocircle" style="background-color: #2e7d32;">
                <p class="logotext" style="color: white;">Food<br />House</p>
              </div>
              <h2>Foodhouse Dispatched Form</h2>
            </div>

            <div class="section">
              <div class="section-title">Order Details</div>
              <div class="info-row"><span><strong>Order Number:</strong> ${orderId}</span></div>
              <div class="info-row"><span><strong>Quantity:</strong> ${quantity} ${unit}</span></div>
              <div class="info-row"><span><strong>Delivery Location:</strong> ${deliveryLocation}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Farmer</div>
              <div class="info-row"><span><strong>Name:</strong> ${farmerName}</span></div>
              <div class="info-row"><span><strong>Address:</strong> ${farmerAddress}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Buyer</div>
              <div class="info-row"><span><strong>Name:</strong> ${buyerName}</span></div>
              <div class="info-row"><span><strong>Phone:</strong> ${parsePhoneNumberFromString(
                buyerPhone
              )?.formatInternational()}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Agent</div>
              <div class="info-row"><span><strong>Name:</strong> ${agentName}</span></div>
              <div class="info-row"><span><strong>Phone:</strong> ${parsePhoneNumberFromString(
                agentPhone
              )?.formatInternational()}</span></div>
            </div>
          </div>

          <div class="footer"  style="background-color: #2e7d32;>
            <p style="color: white;">📞 ${parsePhoneNumberFromString(
              FOODHOUSE_PHONE ?? ""
            )?.formatInternational()}</p>
            <p style="color: white;">✉️ ${FOODHOUSE_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
  `;

  const file = await RNHTMLtoPDF.convert({
    html: htmlContent,
    fileName: `foodhouse_dispatch_${orderId}`,
    base64: false,
  });

  await sharePdf(file.filePath ?? "");
};

export const sharePdf = async (filePath: string) => {
  if (await Sharing.isAvailableAsync()) {
    const uri = filePath.startsWith("file://")
      ? filePath
      : `file://${filePath}`;
    await Sharing.shareAsync(uri);
  } else {
    throw new Error("Sharing is not available on this device");
  }
};
