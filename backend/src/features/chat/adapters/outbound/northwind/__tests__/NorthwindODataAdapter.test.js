const axiosPath = require.resolve("axios");
const mockAxios = { get: vi.fn() };
require.cache[axiosPath] = {
  id: axiosPath, filename: axiosPath, loaded: true, exports: mockAxios
};

const adapter = require("../NorthwindODataAdapter");
const NW_BASE = "https://services.odata.org/V3/Northwind/Northwind.svc";

beforeEach(() => { vi.clearAllMocks(); });

test("getSchema() devuelve las 3 entidades esperadas", () => {
  const schema = adapter.getSchema();
  expect(schema).toHaveProperty("Orders");
  expect(schema).toHaveProperty("Customers");
  expect(schema).toHaveProperty("Order_Details");
});

test("Cada entidad tiene filters, expand y maxTop", () => {
  const schema = adapter.getSchema();
  expect(schema.Orders.filters).toContain("OrderID");
  expect(schema.Orders.expand).toContain("Customer");
  expect(schema.Orders.maxTop).toBe(50);
  expect(schema.Customers.filters).toContain("CustomerID");
  expect(schema.Customers.expand).toContain("Orders");
  expect(schema.Customers.maxTop).toBe(50);
  expect(schema.Order_Details.filters).toContain("OrderID");
  expect(schema.Order_Details.expand).toContain("Order");
  expect(schema.Order_Details.maxTop).toBe(50);
});

test("getSchemaDescription() incluye los nombres de las entidades", () => {
  const description = adapter.getSchemaDescription();
  expect(description).toContain("Orders");
  expect(description).toContain("Customers");
  expect(description).toContain("Order_Details");
});

test("calcTotal devuelve 0 para null", () => {
  expect(adapter.calcTotal(null)).toBe(0);
});

test("calcTotal devuelve 0 para array vacio", () => {
  expect(adapter.calcTotal([])).toBe(0);
});

test("calcTotal calcula sin descuento", () => {
  const details = [{ Quantity: 2, UnitPrice: "10.00", Discount: 0 }];
  expect(adapter.calcTotal(details)).toBe(20);
});

test("calcTotal calcula con descuento", () => {
  const details = [{ Quantity: 3, UnitPrice: "15.50", Discount: 0.1 }];
  expect(adapter.calcTotal(details)).toBeCloseTo(41.85);
});

test("query construye URL sin filtros", async () => {
  mockAxios.get.mockResolvedValue({ data: { value: [{ OrderID: 1 }] } });
  const result = await adapter.query("Orders");
  expect(mockAxios.get).toHaveBeenCalledWith(
    `${NW_BASE}/Orders`, expect.objectContaining({ timeout: 10000 })
  );
  expect(result).toEqual([{ OrderID: 1 }]);
});

test("query construye URL con filtros y expand", async () => {
  mockAxios.get.mockResolvedValue({ data: { value: [] } });
  await adapter.query("Orders", [{ field: "OrderID", op: "eq", value: "10248" }], ["Customer"], 5);
  const calledUrl = mockAxios.get.mock.calls[0][0];
  expect(calledUrl).toContain("$filter=");
  expect(calledUrl).toContain("$expand=");
  expect(calledUrl).toContain("$top=5");
  expect(calledUrl).toContain("OrderID%20eq%2010248");
});

test("query codifica filtros de texto", async () => {
  mockAxios.get.mockResolvedValue({ data: { value: [] } });
  await adapter.query("Customers", [{ field: "CompanyName", op: "eq", value: "Alfreds" }]);
  const calledUrl = mockAxios.get.mock.calls[0][0];
  expect(calledUrl).toContain("CompanyName");
  expect(calledUrl).toContain("Alfreds");
});

test("findSimilarOrders devuelve ordenes filtradas", async () => {
  const mockOrders = [
    { OrderID: 10248, CustomerID: "ALFKI", Order_Details: [{ Quantity: 2, UnitPrice: "10.00", Discount: 0 }] },
    { OrderID: 10249, CustomerID: "ALFKI", Order_Details: [{ Quantity: 1, UnitPrice: "20.00", Discount: 0 }] },
    { OrderID: 99999, CustomerID: "ALFKI", OrderDetails: [] }
  ];
  mockAxios.get.mockResolvedValue({ data: { value: mockOrders } });
  const result = await adapter.findSimilarOrders("ALFKI", 10248);
  expect(result).toHaveLength(2);
  expect(result[0].OrderID).toBe(10249);
  expect(result[0]._total).toBe(20);
});

test("findSimilarOrders devuelve null en error", async () => {
  mockAxios.get.mockRejectedValue(new Error("Network error"));
  const result = await adapter.findSimilarOrders("ALFKI", 10248);
  expect(result).toBeNull();
});
