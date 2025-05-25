export interface PaymentBreakdown {
    label: string;
    amount: number;
    count: number;
}

export interface TaxLine {
    rate: number;
    base: number;
    tax: number;
}

export interface ZReport {
    restaurantName: string;
    address: string;
    siret: string;
    openedAt: Date;
    closedAt: Date;
    printedAt: Date;
    orderCount: number;
    customerCount: number;
    averageTicket: number;
    paymentMethods: PaymentBreakdown[];
    taxDetails: TaxLine[];
    totalHT: number;
    totalTTC: number;
    remises: number;
    annulations: number;
    cashStart: number;
    cashEnd: number;
    customerAccountBalance: number;
}


export interface XReport {
    restaurantName: string;
    address: string;
    siret: string;
    openedAt: Date;
    printedAt: Date;
    totalHT: number;
    totalTTC: number;
    ordersCount: number;
    clientsCount: number;
    averageTicket: number;
    payments: PaymentBreakdown[];
    tva: TaxLine[];
}
