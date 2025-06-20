import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as Sharing from 'expo-sharing';

interface DispatchFormProps {
  orderId: string;
  dispatchCity: string;
  destination: string;
  address: string;
  sellerName: string;
  sellerChic: string;
  sellerAddress: string;
  buyerName: string;
  buyerAddress: string;
}

export const generateDispatchFormPdf = async (props: DispatchFormProps) => {
  const {
    orderId,
    dispatchCity,
    destination,
    address,
    sellerName,
    sellerChic,
    sellerAddress,
    buyerName,
    buyerAddress
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

                .confirm-btn {
                    display: block;
                    width: 100%;
                    padding: 12px;
                    margin-top: 30px;
                    background-color: #2625A8;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
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
                        <td>Dispatch City:</td>
                        <td>${dispatchCity}</td>
                    </tr>
                    <tr>
                        <td>Destination:</td>
                        <td>${destination}</td>
                    </tr>
                    <tr>
                        <td>Address:</td>
                        <td>${address}</td>
                    </tr>
                </table>
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">Seller</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${sellerName}</div>
                
                <table>
                    <tr>
                        <td>CHIC:</td>
                        <td>${sellerChic}</td>
                    </tr>
                    <tr>
                        <td>Address:</td>
                        <td>${sellerAddress}</td>
                    </tr>
                </table>
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">Buyer</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${buyerName}</div>
                
                <table>
                    <tr>
                        <td>Address:</td>
                        <td>${buyerAddress}</td>
                    </tr>
                </table>
            </div>

            <button class="confirm-btn" onclick="confirmDispatch()">Confirm Dispatch</button>

            <div class="footer">
                © 2025 Foodhouse. All rights reserved.
            </div>

            <script>
                function confirmDispatch() {
                    // This would need to be handled differently in a real app
                    alert('Dispatch confirmed!');
                }
            </script>
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
    const uri = filePath.startsWith('file://')
      ? filePath
      : `file://${filePath}`;
    await Sharing.shareAsync(uri);
  } else {
    throw 'Sharing is not available on this device';
  }
};