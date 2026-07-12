const axios = require("axios");

const NW_BASE = "https://services.odata.org/V3/Northwind/Northwind.svc";

const ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry", "ShipCity", "OrderDate"], expand: ["Customer", "Order_Details"], maxTop: 50 },
  Customers: { filters: ["CustomerID", "CompanyName", "Country", "City"], expand: ["Orders"], maxTop: 50 },
  Order_Details: { filters: ["OrderID", "ProductID"], expand: ["Order"], maxTop: 50 }
};

const NUMERIC_FIELDS = ["OrderID", "ProductID"];

const getSchema = () => ALLOWED;

const getSchemaDescription = () =>
  Object.keys(ALLOWED).map((e) =>
    `${e} (filtros: ${ALLOWED[e].filters.join(", ")}, expand: ${ALLOWED[e].expand.join(", ")})`
  ).join("\n");

const calcTotal = (details) => {
  if (!details) return 0;
  return details.reduce((sum, d) =>
    sum + d.Quantity * parseFloat(d.UnitPrice) * (1 - (d.Discount || 0)), 0);
};

const buildFilterParams = (filters) => {
  const parts = filters.map((f) => {
    const val = NUMERIC_FIELDS.includes(f.field) ? Number(f.value) : `'${f.value}'`;
    return `${f.field} ${f.op} ${val}`;
  });
  return `$filter=${encodeURIComponent(parts.join(" and "))}`;
};

const query = async (entity, filters, expand, top) => {
  const params = [];
  if (filters?.length > 0) {
    params.push(buildFilterParams(filters));
  }
  if (expand?.length > 0) {
    params.push(`$expand=${expand.join(",")}`);
  }
  if (top) {
    params.push(`$top=${top}`);
  }
  const url = `${NW_BASE}/${entity}${params.length > 0 ? `?${params.join("&")}` : ""}`;
  const res = await axios.get(url, { headers: { Accept: "application/json" }, timeout: 10000 });
  return res.data.value;
};

const findSimilarOrders = async (customerId, excludeOrderId) => {
  try {
    const url = `${NW_BASE}/Orders?$filter=CustomerID eq '${customerId}'&$expand=Order_Details&$top=5`;
    const res = await axios.get(url, { headers: { Accept: "application/json" }, timeout: 10000 });
    let similar = res.data.value || [];
    similar = similar.filter((s) => s.OrderID !== excludeOrderId);
    similar.forEach((s) => {
      s._total = calcTotal(s.Order_Details);
    });
    return similar.slice(0, 3);
  } catch {
    return null;
  }
};

module.exports = { query, findSimilarOrders, calcTotal, getSchema, getSchemaDescription };
