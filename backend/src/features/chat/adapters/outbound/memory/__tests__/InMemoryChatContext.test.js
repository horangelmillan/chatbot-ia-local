const context = require("../InMemoryChatContext");

test("Devuelve null al inicio", () => {
    expect(context.get()).toBeNull();
});

test("set() guarda y get() recupera", () => {
    context.set({ intent: "Orders", id: "10248" });
    expect(context.get()).toEqual({ intent: "Orders", id: "10248" });
});

test("reset() borra el contexto", () => {
    context.reset();
    expect(context.get()).toBeNull();
});