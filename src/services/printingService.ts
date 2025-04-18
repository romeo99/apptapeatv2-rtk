import { Order, OrderItem } from "../types/firebase";

export async function connectToPrinter(): Promise<BluetoothRemoteGATTCharacteristic | null> {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });

        if (!device.gatt) {
            console.error("Le périphérique Bluetooth ne supporte pas GATT.");
            return null;
        }

        const server = await device.gatt.connect();
        console.log(`Connecté à l'imprimante: ${device.name}`);

        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

        return characteristic;
    } catch (error) {
        console.error('Erreur de connexion à l\'imprimante:', error);
        return null;
    }
}

export async function printReceipt(order: Order) {
    const characteristic = await connectToPrinter();
    if (!characteristic) return;

    const encoder = new TextEncoder();
    const data = encoder.encode(formatReceipt(order));

    try {
        await characteristic.writeValue(data);
        console.log('Reçu imprimé avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
    }
}

// Fonction pour formater le reçu
export function formatReceipt(data: Order) {
    return `
    ${data.restaurantId}
    ${data.delivery ? data.delivery.address : 'À emporter'}
    
    Commande #${data.orderNumber}
    Date: ${data.createdAt.toISOString()}
    
    ${data.items.map((item: OrderItem) => `
      ${item.name}
      ${item.quantity} x ${item.price}€ = ${item.quantity * item.price}€
    `).join('\n')}
    
    Total: ${data.total}€
    
    Merci de votre visite!
  `;
}