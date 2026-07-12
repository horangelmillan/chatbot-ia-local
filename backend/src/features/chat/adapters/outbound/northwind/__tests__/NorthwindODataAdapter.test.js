const adapter = require("../NorthwindODataAdapter");

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