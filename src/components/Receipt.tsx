import { forwardRef } from "react";
import { Order } from "../types/firebase";
import { useRestaurantContext } from "../context/RestaurantContext";

interface ReceiptProps {
    order: Order;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
    const { restaurant } = useRestaurantContext();
    
    return (
    <div ref={ref} style={{
        padding: 20,
        fontFamily: "monospace",
        maxWidth: "80mm",
        width: "80mm",
        fontSize: "16px",
        overflow: "hidden",
        wordWrap: "break-word",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
    }}>
        <div style={{ 
            textAlign: "center", 
            marginBottom: "20px",
            fontSize: "32px",
            fontWeight: "bold",
            color: "#1e293b"
        }}
        className="whitespace-nowrap overflow-hidden text-ellipsis">
            {order.restaurantInfo?.name || restaurant?.name || "Tapeat"}
        </div>
        
        <div style={{
            background: "#1e293b",
            color: "white",
            padding: "15px",
            textAlign: "center",
            fontSize: "60px",
            fontWeight: "bold",
            marginBottom: "15px",
            borderRadius: "8px"
        }}>
            {order.orderNumber}
        </div>

        <div style={{ 
            fontSize: "14px", 
            marginBottom: "15px", 
            color: "#1e293b"
        }}>
            Commande passée le {new Date(order.createdAt).toLocaleDateString()} à {new Date(order.createdAt).toLocaleTimeString()}
        </div>

        <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

        <div style={{
            textAlign: "center",
            fontSize: "36px",
            fontWeight: "bold",
            margin: "20px 0",
            color: "#1e293b"
        }}>
            {order.type === 'delivery' ? "LIVRAISON" : order.type === 'dine_in' ? "SUR PLACE" : "EMPORTER"}
        </div>

        <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

        <div style={{ margin: "20px 0" }}>
            {order.items.map((item, index) => (
                <div key={index} style={{ marginBottom: "15px" }}>
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#1e293b"
                    }}>
                        <div style={{ width: "70%" }}>
                            <div style={{ display: "flex" }}>
                                <span style={{ minWidth: "20px" }}>{item.quantity}</span>
                                <span style={{ paddingLeft: "2px", paddingRight: "5px" }}>×</span>
                                <span>{item.name}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>{item.price.toFixed(2)}€</div>
                    </div>
                    
                    {item.remarks && (
                        <p style={{ fontSize: "14px", paddingLeft: "10px", color: "#64748b" }}>
                            {item.remarks}
                        </p>
                    )}
                    
                    {item.sections && item.sections.length > 0 && (
                        <div style={{ paddingLeft: "10px", fontSize: "14px", color: "#64748b" }}>
                            {item.sections.map((section, idx) => (
                                <div key={idx}>
                                    {section.name}: {section.choice}
                                    {!section.included && <span style={{ color: "#10b981" }}> (+supplément)</span>}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                        <div style={{ paddingLeft: "10px", fontSize: "14px", color: "#ef4444" }}>
                            Sans: {item.excludedIngredients.join(', ')}
                        </div>
                    )}
                </div>
            ))}
        </div>

        <hr style={{ margin: "15px 0", border: "none", borderTop: "1px dashed #e2e8f0" }} />

        {order.message && (
            <>
                <div style={{ margin: "15px 0" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "16px", color: "#1e293b" }}>
                        Remarques du client:
                    </div>
                    <div style={{
                        padding: "10px",
                        fontSize: "14px",
                        color: "#64748b",
                        wordWrap: "break-word"
                    }}>
                        {order.message}
                    </div>
                </div>
                <hr style={{ margin: "15px 0", border: "none", borderTop: "1px dashed #e2e8f0" }} />
            </>
        )}

        <div style={{ margin: "20px 0" }}>
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: "10px", 
                fontSize: "18px",
                color: "#64748b"
            }}>
                <div>Sous-total</div>
                <div>{order.subtotal.toFixed(2)}€</div>
            </div>
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontWeight: "bold", 
                fontSize: "24px",
                color: "#1e293b"
            }}>
                <div>Montant payé</div>
                <div>{order.total.toFixed(2)}€</div>
            </div>
        </div>

        <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

        <div style={{ 
            fontSize: "14px", 
            textAlign: "center", 
            margin: "15px 0",
            color: "#64748b"
        }}>
            Merci pour votre commande
        </div>
    </div>
)});

export default Receipt;