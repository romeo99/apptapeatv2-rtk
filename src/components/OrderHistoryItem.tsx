@@ .. @@
                     <div className="flex justify-between">
                       <span className="font-medium">{item.quantity}x {item.name}</span>
                       <span>{(item.price * item.quantity).toFixed(2)} €</span>
                     </div>
+                    {item.remarks && (
+                      <div className="text-sm text-gray-600 italic mt-1">
                        <span className="font-medium">Remarque :</span> {item.remarks}
+                        <span className="font-medium">Remarque client :</span> {item.remarks}
+                      </div>
+                    )}
                     {item.menuOptions && (
@@ .. @@
                     {item.excludedIngredients?.length > 0 && (
                       <div className="text-sm text-red-500 mt-1">
                         Sans : {item.excludedIngredients.join(', ')}
                       </div>
                     )}
-                    {item.remarks && (
-                      <div className="text-sm text-gray-600 italic mt-1">
-                        Remarque : {item.remarks}
-                      </div>
-                    )}
-                    {item.remarks && (
-                      <div className="text-sm text-gray-600 italic mt-1">
-                        Remarque : {item.remarks}
-                      </div>
-                    )}
-                    {item.remarks && (
-                      <div className="text-sm text-gray-600 italic">
-                        Remarque : {item.remarks}
-                      </div>
-                    )}
                   </div>
                 </div>