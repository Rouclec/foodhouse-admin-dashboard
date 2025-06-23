import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as Sharing from 'expo-sharing';

interface DispatchFormProps {
  orderId: string;
  product: string;
  quantity: string;
  amount: string;
  address: string;
  sellerName: string;
  sellerPhone: string;
  buyerName: string;
  buyerPhone: string;
}

export const generateDispatchFormPdf = async (props: DispatchFormProps) => {
  const {
    orderId,
    product,
    quantity,
    amount,
    address,
    sellerName,
    sellerPhone,
    buyerName,
    buyerPhone,
  } = props;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8" />
            <title>Foodhouse Dispatch Form</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 24px;
                    color: #333;
                }

                .header h1 {
                    margin: 0;
                    color: #2625A8;
                    text-align: center;
                }

                .section {
                    margin-top: 20px;
                }

                .section-title {
                    font-weight: bold;
                    font-size: 18px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                }

                .order-id {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 15px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }

                table td {
                    padding: 8px 0;
                    vertical-align: top;
                }

                table td:first-child {
                    font-weight: bold;
                    width: 30%;
                }

                .divider {
                    border-top: 1px dashed #ccc;
                    margin: 20px 0;
                }

                .footer {
                    margin-top: 40px;
                    font-size: 12px;
                    color: #777;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Foodhouse Dispatched Form</h1>
            </div>

            <div class="section">
                <div class="section-title">Order Details</div>
                <div class="order-id">#${orderId}</div>
                <table>
                    <tr>
                        <td>Product:</td>
                        <td>${product}</td>
                    </tr>
                    <tr>
                        <td>Quantity:</td>
                        <td>${quantity}</td>
                    </tr>
                    <tr>
                        <td>Amount:</td>
                        <td>${amount}</td>
                    </tr>
                    <tr>
                        <td>Delivery Address:</td>
                        <td>${address}</td>
                    </tr>
                </table>
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">Seller</div>
                <table>
                    <tr>
                        <td>Name:</td>
                        <td>${sellerName}</td>
                    </tr>
                    <tr>
                        <td>Phone:</td>
                        <td>${sellerPhone}</td>
                    </tr>
                </table>
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">Buyer</div>
                <table>
                    <tr>
                        <td>Name:</td>
                        <td>${buyerName}</td>
                    </tr>
                    <tr>
                        <td>Phone:</td>
                        <td>${buyerPhone}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                © 2025 Foodhouse. All rights reserved.
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
