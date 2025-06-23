import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as Sharing from 'expo-sharing';

interface DispatchFormProps {
  orderId: string;
  quantity: string;
  deliveryLocation: string;
  farmerName: string;
  farmerAddress: string;
  farmerPhone: string;
  buyerName: string;
  buyerPhone: string;
  agentName: string;
  agentPhone: string;
}

export const generateDispatchFormPdf = async (props: DispatchFormProps) => {
  const {
    orderId,
    quantity,
    deliveryLocation,
    farmerName,
    farmerAddress,
    farmerPhone,
    buyerName,
    buyerPhone,
    agentName,
    agentPhone,
  } = props;

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
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
          background-color: #4caf50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.75rem;
        }

        .Logotext {
          color: white;
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
          background-color: #4caf50;
          color: white;
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
            <div class="logocircle">
              <p class="Logotext">Food<br />House</p>
            </div>
            <h2>Foodhouse Dispatched Form</h2>
          </div>

          <div class="section">
            <div class="section-title">Order Details</div>
            <div class="info-row"><span><strong>Order Number:</strong> #${orderId}</span></div>
            <div class="info-row"><span><strong>Quantity:</strong> ${quantity}</span></div>
            <div class="info-row"><span><strong>Delivery Location:</strong> ${deliveryLocation}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Farmer</div>
            <div class="info-row"><span><strong>Name:</strong> ${farmerName}</span></div>
            <div class="info-row"><span><strong>Address:</strong> ${farmerAddress}</span></div>
            <div class="info-row"><span><strong>Phone:</strong> ${farmerPhone}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Buyer</div>
            <div class="info-row"><span><strong>Name:</strong> ${buyerName}</span></div>
            <div class="info-row"><span><strong>Phone:</strong> ${buyerPhone}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Agent</div>
            <div class="info-row"><span><strong>Name:</strong> ${agentName}</span></div>
            <div class="info-row"><span><strong>Phone:</strong> ${agentPhone}</span></div>
          </div>
        </div>

        <div class="footer">
          <div>📞 +237 654 456 789</div>
          <div>✉️ info@foodhouse.com</div>
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

  await sharePdf(file.filePath ?? '');
};

export const sharePdf = async (filePath: string) => {
  if (await Sharing.isAvailableAsync()) {
    const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    await Sharing.shareAsync(uri);
  } else {
    throw new Error('Sharing is not available on this device');
  }
};
