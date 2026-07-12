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

// --- enrichOrderContext ---
test("enrichOrderContext con Customer null no llama findSimilarOrders", async () => {
  const mockOdata = mockOdataBase();
  const useCase = new ChatUseCase(null, mockOdata, null, mockContextBase());
  const data = [{ OrderID: 10248, Order_Details: [] }];
  const result = await useCase.enrichOrderContext(data);
  expect(result[0]._total).toBe(0);
  expect(mockOdata.findSimilarOrders).not.toHaveBeenCalled();
});

test("enrichOrderContext con Order_Details vacio", async () => {
  const mockOdata = mockOdataBase();
  const useCase = new ChatUseCase(null, mockOdata, null, mockContextBase());
  const data = [{ OrderID: 10248, CustomerID: "ALFKI", Order_Details: [] }];
  await useCase.enrichOrderContext(data);
  expect(mockOdata.calcTotal).toHaveBeenCalledWith([]);
  expect(mockOdata.findSimilarOrders).toHaveBeenCalledWith("ALFKI", 10248);
});

test("enrichOrderContext con descuento parcial", async () => {
  const mockOdata = mockOdataBase();
  mockOdata.calcTotal.mockReturnValue(41.85);
  const useCase = new ChatUseCase(null, mockOdata, null, mockContextBase());
  const data = [{
    OrderID: 10248, CustomerID: "ALFKI",
    Order_Details: [
      { ProductID: 1, Quantity: 3, UnitPrice: "15.50", Discount: 0.1 },
      { ProductID: 2, Quantity: 2, UnitPrice: "10.00", Discount: 0 }
    ]
  }];
  const result = await useCase.enrichOrderContext(data);
  expect(result[0]._total).toBe(41.85);
});

test("enrichOrderContext con findSimilarOrders con resultados", async () => {
  const mockOdata = mockOdataBase();
  mockOdata.findSimilarOrders.mockResolvedValue([
    { OrderID: 10249, OrderDate: "2024-01-01", _total: 200 }
  ]);
  const useCase = new ChatUseCase(null, mockOdata, null, mockContextBase());
  const data = [{ OrderID: 10248, CustomerID: "ALFKI", Order_Details: [] }];
  const result = await useCase.enrichOrderContext(data);
  expect(result[0]._similarOrders).toHaveLength(1);
});

test("enrichOrderContext con multiples items no llama findSimilarOrders", async () => {
  const mockOdata = mockOdataBase();
  const useCase = new ChatUseCase(null, mockOdata, null, mockContextBase());
  const data = [
    { OrderID: 10248, CustomerID: "ALFKI", Order_Details: [] },
    { OrderID: 10249, CustomerID: "ANATR", Order_Details: [] }
  ];
  await useCase.enrichOrderContext(data);
  expect(mockOdata.findSimilarOrders).not.toHaveBeenCalled();
});

// --- buildContext (through execute) ---
test("intent query sin resultados buildContext devuelve cadena vacia", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"eq","value":"99999"}]}')
      .mockResolvedValueOnce("No encontre esa orden")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "orden 99999" });
  expect(result.reply).toBe("No encontre esa orden");
});

test("buildContext con entity Orders y similarOrders genera contexto completo", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"eq","value":"10248"}]}')
      .mockResolvedValueOnce("Respuesta sobre la orden 10248")
  };
  const mockOdata = mockOdataBase();
  mockOdata.findSimilarOrders.mockResolvedValue([
    { OrderID: 10249, OrderDate: "2024-01-01", _total: 200 }
  ]);
  mockOdata.query.mockResolvedValue([{
    OrderID: 10248, CustomerID: "ALFKI",
    Customer: { CompanyName: "Alfreds", Country: "Germany" },
    Order_Details: [{ ProductID: 1, Quantity: 3, UnitPrice: "15.50", Discount: 0 }]
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "dame la orden 10248" });
  expect(result.reply).toBe("Respuesta sobre la orden 10248");
});

test("buildContext con entity Customers", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Customers","filters":[{"field":"CustomerID","op":"eq","value":"ALFKI"}]}')
      .mockResolvedValueOnce("Cliente ALFKI")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{
    CustomerID: "ALFKI", CompanyName: "Alfreds Futterkiste",
    ContactName: "Maria Anders", ContactTitle: "Sales Representative",
    Address: "Obere Str. 57", City: "Berlin", Country: "Germany",
    Phone: "030-0074321",
    Orders: [{ OrderID: 10248, OrderDate: "2024-01-01", Freight: 10 }]
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "cliente ALFKI" });
  expect(result.reply).toBe("Cliente ALFKI");
});

test("buildContext con entity Customers sin CustomerID devuelve vacio", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Customers","filters":[{"field":"CustomerID","op":"eq","value":"INVALID"}]}')
      .mockResolvedValueOnce("Cliente no encontrado")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{}]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "cliente invalido" });
  expect(result.reply).toBe("Cliente no encontrado");
});

test("buildContext con entity Order_Details", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Order_Details","filters":[{"field":"OrderID","op":"eq","value":"10248"}]}')
      .mockResolvedValueOnce("Factura orden 10248")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{
    OrderID: 10248, ProductID: 1, Quantity: 3, UnitPrice: "15.50", Discount: 0.1,
    Order: { OrderID: 10248, OrderDate: "2024-01-01", CustomerID: "ALFKI" }
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "factura 10248" });
  expect(result.reply).toBe("Factura orden 10248");
});

test("buildContext con entity desconocida usa fallback JSON", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Suppliers","filters":[]}')
      .mockResolvedValueOnce("Respuesta")
  };
  const mockOdata = mockOdataBase();
  mockOdata.getSchema.mockReturnValue({
    Suppliers: { filters: [], expand: [], maxTop: 50 }
  });
  mockOdata.query.mockResolvedValue([{ CompanyName: "Proveedor X", Country: "Spain" }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "proveedor" });
  expect(result.reply).toBe("Respuesta");
});

// --- JSON edge cases ---
test("JSON con campos extra no rompe el parseo", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"reply","text":"OK","extraField":"sobrante"}'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("OK");
});

test("JSON array en vez de objeto usa fallback", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('[1, 2, 3]')
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("No entendi, puedes repetirlo?");
});

test("JSON malformado con llaves usa fallback reply", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue("{invalid: json}")
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "test" });
  expect(result.reply).toBe("{invalid: json}");
});

// --- validateQuery ---
test("intent query sin filters ni expand pasa validacion", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders"}')
      .mockResolvedValueOnce("Lista de ordenes")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{ OrderID: 10248, Order_Details: [] }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "lista ordenes" });
  expect(result.reply).toBe("Lista de ordenes");
});

test("intent query con entity invalida devuelve error entidad", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"query","entity":"InvalidEnt","filters":[]}'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "consulta invalida" });
  expect(result.reply).toBe("Entidad no valida: InvalidEnt");
});

// --- document_query non-faq ---
test("intent document_query con tipo no-faq y title devuelve titulo y contenido", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"document_query","category":"General","keywords":["test"]}'
    )
  };
  const mockRepo = {
    search: vi.fn().mockResolvedValue({
      type: "doc",
      data: { title: "Documento", content: "Contenido del documento" }
    })
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), mockRepo, mockContextBase());
  const result = await useCase.execute({ message: "documento test" });
  expect(result.reply).toBe("Documento\n\nContenido del documento");
});

test("intent document_query sin title usa solo content", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"document_query","category":"General","keywords":["test"]}'
    )
  };
  const mockRepo = {
    search: vi.fn().mockResolvedValue({
      type: "doc",
      data: { content: "Solo contenido" }
    })
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), mockRepo, mockContextBase());
  const result = await useCase.execute({ message: "documento test" });
  expect(result.reply).toBe("Solo contenido");
});

test("intent query con expand valido pasa validacion", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","expand":["Customer","Order_Details"]}')
      .mockResolvedValueOnce("Ordenes con detalles")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{ OrderID: 10248, Order_Details: [] }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "orden con detalles" });
  expect(result.reply).toBe("Ordenes con detalles");
});

test("intent query con top valido pasa validacion", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","top":5}')
      .mockResolvedValueOnce("Top 5 ordenes")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{ OrderID: 10248, Order_Details: [] }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "top 5 ordenes" });
  expect(result.reply).toBe("Top 5 ordenes");
});

test("buildContext con entity Customers sin Orders usa array vacio", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Customers","filters":[{"field":"CustomerID","op":"eq","value":"ALFKI"}]}')
      .mockResolvedValueOnce("Cliente sin ordenes")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{
    CustomerID: "ALFKI", CompanyName: "Alfreds Futterkiste"
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "cliente ALFKI" });
  expect(result.reply).toBe("Cliente sin ordenes");
});

test("buildContext con Customers con OrderDate y Freight null usa fallbacks", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Customers","filters":[{"field":"CustomerID","op":"eq","value":"ALFKI"}]}')
      .mockResolvedValueOnce("Cliente con ordenes sin fecha")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{
    CustomerID: "ALFKI", CompanyName: "Alfreds",
    ContactName: "Maria", ContactTitle: "Rep",
    Address: "Str 1", City: "Berlin", Country: "Germany",
    Phone: "030",
    Orders: [{ OrderID: 10248 }]
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "cliente ALFKI" });
  expect(result.reply).toBe("Cliente con ordenes sin fecha");
});

test("buildContext con Order_Details con Order nulo usa fallbacks", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Order_Details","filters":[{"field":"OrderID","op":"eq","value":"99999"}]}')
      .mockResolvedValueOnce("Factura sin datos de orden")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{
    OrderID: 99999, ProductID: 1, Quantity: 3, UnitPrice: "15.50", Discount: 0
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "factura 99999" });
  expect(result.reply).toBe("Factura sin datos de orden");
});

test("buildContext con Orders sin Order_Details usa fallback array vacio", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"eq","value":"10248"}]}')
      .mockResolvedValueOnce("Orden sin detalles")
  };
  const mockOdata = mockOdataBase();
  mockOdata.calcTotal.mockReturnValue(100);
  mockOdata.query.mockResolvedValue([{
    OrderID: 10248, CustomerID: "ALFKI",
    Customer: { CompanyName: "Alfreds" }
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "orden 10248" });
  expect(result.reply).toBe("Orden sin detalles");
});

test("buildContext con Customers sin CompanyName usa fallback vacio", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Customers","filters":[{"field":"CustomerID","op":"eq","value":"ALFKI"}]}')
      .mockResolvedValueOnce("Cliente sin nombre")
  };
  const mockOdata = mockOdataBase();
  mockOdata.query.mockResolvedValue([{
    CustomerID: "ALFKI",
    ContactName: "Maria", ContactTitle: "Rep",
    Address: "Str 1", City: "Berlin", Country: "Germany", Phone: "030",
    Orders: []
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "cliente ALFKI" });
  expect(result.reply).toBe("Cliente sin nombre");
});

test("buildContext con similarOrders con OrderDate y _total null usa fallbacks", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"eq","value":"10248"}]}')
      .mockResolvedValueOnce("Respuesta con similar orders null")
  };
  const mockOdata = mockOdataBase();
  mockOdata.findSimilarOrders.mockResolvedValue([{ OrderID: 10249 }]);
  mockOdata.query.mockResolvedValue([{
    OrderID: 10248, CustomerID: "ALFKI",
    Customer: { CompanyName: "Alfreds" },
    Order_Details: [{ ProductID: 1, Quantity: 3, UnitPrice: "15.50", Discount: 0 }]
  }]);
  const useCase = new ChatUseCase(mockLlm, mockOdata, null, mockContextBase());
  const result = await useCase.execute({ message: "dame la orden 10248" });
  expect(result.reply).toBe("Respuesta con similar orders null");
});

test("intent query con operador invalido devuelve error", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"ne","value":"10248"}]}'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "operador invalido" });
  expect(result.reply).toBe("Operador no valido: ne");
});

test("intent query con expand invalido devuelve error", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"query","entity":"Orders","expand":["InvalidExpand"]}'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "expand invalido" });
  expect(result.reply).toBe("Expand no valido: InvalidExpand");
});

test("intent query con top fuera de rango devuelve error", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue(
      '{"intent":"query","entity":"Orders","top":100}'
    )
  };
  const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContextBase());
  const result = await useCase.execute({ message: "top invalido" });
  expect(result.reply).toBe("Top fuera de rango (max 50)");
});
