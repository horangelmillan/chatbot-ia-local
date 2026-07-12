const axios = require("axios");

var NW_BASE = "https://services.odata.org/V3/Northwind/Northwind.svc";

var ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry", "ShipCity", "OrderDate"], expand: ["Customer", "Order_Details"], maxTop: 50 },
  Customers: { filters: ["CustomerID", "CompanyName", "Country", "City"], expand: ["Orders"], maxTop: 50 },
  Order_Details: { filters: ["OrderID", "ProductID"], expand: ["Order"], maxTop: 50 }
};

function getSchema() {
  return ALLOWED;
}

function getSchemaDescription() {
  return Object.keys(ALLOWED).map(function (e) {
    return e + " (filtros: " + ALLOWED[e].filters.join(", ") + ", expand: " + ALLOWED[e].expand.join(", ") + ")";
  }).join("\n");
}

var NUMERIC_FIELDS = ["OrderID", "ProductID"];

function calcTotal(details) {
  if (!details) return 0;
  return details.reduce(function (sum, d) {
    return sum + d.Quantity * parseFloat(d.UnitPrice) * (1 - (d.Discount || 0));
  }, 0);
}

async function query(entity, filters, expand, top) {
  var params = [];
  if (filters && filters.length > 0) {
    var parts = filters.map(function (f) {
      var val = NUMERIC_FIELDS.indexOf(f.field) >= 0 ? Number(f.value) : "'" + f.value + "'";
      return f.field + " " + f.op + " " + val;
    });
    params.push("$filter=" + encodeURIComponent(parts.join(" and ")));
  }
  if (expand && expand.length > 0) {
    params.push("$expand=" + expand.join(","));
  }
  if (top) {
    params.push("$top=" + top);
  }
  var url = NW_BASE + "/" + entity + (params.length > 0 ? "?" + params.join("&") : "");
  var res = await axios.get(url, { headers: { Accept: "application/json" }, timeout: 10000 });
  return res.data.value;
}

async function findSimilarOrders(customerId, excludeOrderId) {
  try {
    var url = NW_BASE + "/Orders?$filter=CustomerID eq '" + customerId + "'&$expand=Order_Details&$top=5";
    var res = await axios.get(url, { headers: { Accept: "application/json" }, timeout: 10000 });
    var similar = res.data.value || [];
    similar = similar.filter(function (s) { return s.OrderID !== excludeOrderId; });
    similar.forEach(function (s) {
      s._total = calcTotal(s.Order_Details);
    });
    return similar.slice(0, 3);
  } catch (e) {
    return null;
  }
}

module.exports = { query, findSimilarOrders, calcTotal, getSchema, getSchemaDescription };
