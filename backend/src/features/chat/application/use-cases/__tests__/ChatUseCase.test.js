const { ChatUseCase } = require("../ChatUseCase");

const mockOdataBase = () => ({
  getSchema: vi.fn().mockReturnValue({
    Orders: { filters: ["OrderID", "CustomerID"], expand: ["Customer", "Order_Details"], maxTop: 50 },
    Customers: { filters: ["CustomerID"], expand: ["Orders"], maxTop: 50 },
    Order_Details: { filters: ["OrderID"], expand: ["Order"], maxTop: 50 }
  }),
  getSchemaDescription: vi.fn().mockReturnValue("Orders, Customers, Order_Details"),
  query: vi.fn(),
  calcTotal: vi.fn().mockReturnValue(0),
  findSimilarOrders: vi.fn().mockResolvedValue([])
});

const mockContextBase = () => ({
  get: vi.fn().mockReturnValue(null),
  set: vi.fn(),
  reset: vi.fn()
});

test("mensaje vacio devuelve error", async () => {
  const useCase = new ChatUseCase(null, null, null, null);
  const result = await useCase.execute({ message: "" });
  expect(result.reply).toBe("El mensaje no puede estar vacio.");
});

test("intent reply devuelve texto directo", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"reply","text":"Hola!"}')
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("Hola!");
});

test("intent reply con botones", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"reply","text":"Elige","buttons":[{"label":"Si","message":"si"}]}'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "opciones" });
  expect(result.reply).toBe("Elige");
  expect(result.buttons).toHaveLength(1);
  expect(result.buttons[0].label).toBe("Si");
});

test("intent query ejecuta OData y genera respuesta", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce(
        '{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"eq","value":"10248"}]}'
      )
      .mockResolvedValueOnce("La orden 10248 tiene un total de $500.")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([
    { OrderID: 10248, Order_Details: [], Customer: {} }
  ]);
  mockOdata.calcTotal.mockReturnValue(500);
  const mockRepo = { search: vi.fn() };
  const mockContext = mockContextBase();

  const useCase = new ChatUseCase(mockLlm, mockOdata, mockRepo, mockContext);
  const result = await useCase.execute({ message: "dame la orden 10248" });

  expect(result.reply).toBe("La orden 10248 tiene un total de $500.");
  expect(mockLlm.chatCompletion).toHaveBeenCalledTimes(2);
  expect(mockOdata.query).toHaveBeenCalledWith(
    "Orders", [{ field: "OrderID", op: "eq", value: "10248" }], undefined, undefined
  );
  expect(mockContext.set).toHaveBeenCalled();
});

test("intent document_query busca FAQ y devuelve tipo document", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"document_query","category":"Facturacion","keywords":["factura"]}'
    )
  };
  const mockRepo = {
    search: vi.fn().mockResolvedValue({
      type: "faq",
      data: { question: "Como facturar?", answer: "Para facturar sigue estos pasos..." }
    })
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), mockRepo, mockContextBase());
  const result = await useCase.execute({ message: "como facturo?" });

  expect(result.reply).toContain("Como facturar?");
  expect(result.reply).toContain("Para facturar sigue estos pasos...");
  expect(result.type).toBe("document");
});

test("intent document_query sin resultados", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"document_query","category":"Facturacion","keywords":["xyz123"]}'
    )
  };
  const mockRepo = { search: vi.fn().mockResolvedValue(null) };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), mockRepo, mockContextBase());
  const result = await useCase.execute({ message: "algo inexistente" });
  expect(result.reply).toBe("No encontre documentacion sobre ese tema.");
});

test("intent unknown rechaza la consulta", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"unknown"}')
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "que hora es?" });
  expect(result.reply).toContain("No puedo ayudar");
});

test("intent continuation sin contexto previo devuelve error", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"continuation"}')
  };
  const mockContext = mockContextBase();
  mockContext.get.mockReturnValue(null);
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContext);
  const result = await useCase.execute({ message: "sigue" });
  expect(result.reply).toContain("Aun no has consultado nada");
});

test("intent continuation con contexto previo genera respuesta", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"continuation"}')
      .mockResolvedValueOnce("Respuesta de continuacion.")
  };
  const mockContext = mockContextBase();
  mockContext.get.mockReturnValue({
    intent: "Orders",
    id: "10248",
    context: "Orden #10248"
  });
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContext);
  const result = await useCase.execute({ message: "dime mas" });
  expect(result.reply).toBe("Respuesta de continuacion.");
});

test("intent query con validacion fallida devuelve error", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"query","entity":"Orders","filters":[{"field":"InvalidField","op":"eq","value":"x"}]}'
    )
  };
  const mockOdata = mockOdataBase();
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "consulta invalida" });
  expect(result.reply).toContain("Filtro no valido");
});

test("intent no reconocido devuelve mensaje generico", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"some_garbage"}')
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "algo raro" });
  expect(result.reply).toBe("No entendi, puedes repetirlo?");
});

test("LLM devuelve JSON malformado sin llaves, usa fallback reply", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue("texto plano sin json")
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("texto plano sin json");
});

test("LLM devuelve JSON con triple backtick, extrae contenido", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '```json\n{"intent":"reply","text":"extraido"}\n```'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("extraido");
});

test("LLM lanza error, se propaga", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockRejectedValue(new Error("Network error"))
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  await expect(useCase.execute({ message: "hola" })).rejects.toThrow("Network error");
});
