import { forwardRef } from "react";
import { ZReport } from "../../types/tickets"; // à créer
import { formatDate } from "../../utils/formatters";

interface ZReceiptProps {
    report: ZReport;
}

const ZReceipt = forwardRef<HTMLDivElement, ZReceiptProps>(({ report }, ref) => {
    return (
        <div ref={ref} style={{
            padding: 10,
            fontFamily: "monospace",
            maxWidth: "80mm",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
        }}>
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", background: "black", color: "white", padding: "2px" }}>
                Ticket Z
            </div>

            <div style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0" }}>
                {report.restaurantName}
            </div>
            <div style={{ textAlign: "center" }}>
                {report.address}
                <br />
                {report.siret}
            </div>

            <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Date d'impression:</div>
                    <div>{formatDate(report.printedAt)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Ouverture:</div>
                    <div>{formatDate(report.openedAt)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Clôture:</div>
                    <div>{formatDate(report.closedAt)}</div>
                </div>

                <br />

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Commandes : {report.orderCount}</div>
                    <div>Clients : {report.customerCount}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>Ticket moyen :</div>
                    <div>{report.averageTicket.toFixed(2)} EUR</div>
                </div>
            </div>

            <br />
            <hr style={{ margin: "5px 0", border: "none", borderTop: "1px dashed #050506FF" }} />

            {report.paymentMethods.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>{m.count} {m.label === 'card' ? 'Carte bancaire' : m.label === 'cash' ? 'Espèces' : 'Apple Pay'}</div>
                    <div>{m.amount.toFixed(2)} EUR</div>
                </div>
            ))}

            <hr style={{ margin: "5px 0", border: "none", borderTop: "1px dashed #050506FF" }} />

            {report.taxDetails.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>TVA ({t.rate.toFixed(1)}%) {t.base.toFixed(2)}</div>
                    <div>{t.tax.toFixed(2)} EUR</div>
                </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <div>TOTAL HT</div>
                <div>{report.totalHT.toFixed(2)} EUR</div>
            </div>

            <hr style={{ margin: "5px 0", border: "none", borderTop: "1px dashed #050506FF" }} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold" }}>
                <div>TOTAL TTC</div>
                <div>{report.totalTTC.toFixed(2)} EUR</div>
            </div>

            <hr style={{ margin: "5px 0", border: "none", borderTop: "1px dashed #050506FF" }} />
            <br />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>TOTAL Remises & Offerts</div>
                <div>{report.remises.toFixed(2)} EUR</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>TOTAL Annulations</div>
                <div>{report.annulations.toFixed(2)} EUR</div>
            </div>

            <br />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Fond de caisse initial</div>
                <div>{report.cashStart.toFixed(2)} EUR</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Fond de caisse final</div>
                <div>{report.cashEnd.toFixed(2)} EUR</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Solde total des comptes clients</div>
                <div>{report.customerAccountBalance.toFixed(2)} EUR</div>
            </div>
        </div>
    );
});

export default ZReceipt;
