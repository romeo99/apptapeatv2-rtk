import { forwardRef } from "react";
import { XReport } from "../../types/tickets";
import { formatDate } from "../../utils/formatters";

interface XReportProps {
    report: XReport;
}

const XReceipt = forwardRef<HTMLDivElement, XReportProps>(({ report }, ref) => {
    return (
        <div ref={ref} style={{
            padding: 10,
            fontFamily: "monospace",
            maxWidth: "80mm",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
        }}>
            <div style={{ background: "#1e293b", color: "white", textAlign: "center", padding: "5px", fontWeight: "bold", fontSize: "20px" }}>
                Ticket X
            </div>

            <div style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0" }}>
                {report.restaurantName}
            </div>
            <div style={{ textAlign: "center" }}>
                {report.address}
                <br />
                {report.siret}
            </div>

            <br />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Date d'impression:</div>
                <div>{formatDate(report.printedAt)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Ouverture:</div>
                <div>{formatDate(report.openedAt)}</div>
            </div>

            <br />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Commandes : {report.ordersCount}</div>
                <div>Clients : {report.clientsCount}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Ticket moyen :</div>
                <div>{report.averageTicket.toFixed(2)} EUR</div>
            </div>

            <hr style={{ margin: "5px 0", border: "none", borderTop: "1px dashed #050506FF" }} />

            {report.payments.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>{m.count} {m.label === 'card' ? 'Carte bancaire' : m.label === 'cash' ? 'Espèces' : 'Apple Pay'}</div>
                    <div>{m.amount.toFixed(2)} EUR</div>
                </div>
            ))}

            <hr style={{ margin: "5px 0", border: "none", borderTop: "1px dashed #050506FF" }} />

            {report.tva.map((t, i) => (
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

            <div style={{ fontStyle: "italic", color: "#64748b", textAlign: "center", marginTop: 10 }}>
                * Rapport de contrôle - aucune clôture effectuée *
            </div>
        </div>
    );
});

export default XReceipt;
