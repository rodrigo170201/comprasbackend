import express from "express";
import fs from "fs";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const readData = () => {
  try {
    const data = fs.readFileSync("./db.json");
    return JSON.parse(data);
  } catch (error) {
    console.log(error);
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync("./db.json", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(error);
  }
};

// Obtener todas las listas
app.get("/lists", (req, res) => {
  const data = readData();
  res.json(data.lists);
});

// Crear una nueva lista
app.post("/lists", (req, res) => {
  const data = readData();
  const { name } = req.body;

  const newList = {
    id: data.lists.length + 1,
    name,
    products: [],
    total: 0.0,
  };

  data.lists.push(newList);
  writeData(data);
  res.json(newList);
});

// Agregar un producto a una lista
app.post("/lists/:id/products", (req, res) => {
  const data = readData();
  const listId = parseInt(req.params.id);
  const list = data.lists.find((l) => l.id === listId);

  if (!list) {
    return res.status(404).json({ message: "List not found" });
  }

  const { name, quantity, unitPrice } = req.body;

  // Validación para asegurar que quantity y unitPrice son números positivos
  if (quantity <= 0 || unitPrice <= 0) {
    return res.status(400).json({ message: "Quantity and unit price must be greater than 0" });
  }

  // Cálculo del total del producto
  const totalProduct = quantity * unitPrice;

  // Crear un nuevo producto
  const newProduct = {
    id: data.products.length + 1,
    name,
    quantity,
    unitPrice,
    totalProduct,
  };

  // Añadir el nuevo producto al arreglo de productos
  data.products.push(newProduct);

  // Añadir el ID del nuevo producto a la lista correspondiente
  list.products.push(newProduct.id);

  // Actualizar el total de la lista con el nuevo total del producto
  list.total = list.total + totalProduct;

  // Guardar los datos actualizados
  writeData(data);

  // Responder con el mensaje de éxito y la lista actualizada
  res.json({ message: "Product added successfully", list });
});

// Obtener los productos de una lista
app.get("/lists/:id/products", (req, res) => {
  const data = readData();
  const listId = parseInt(req.params.id);
  const list = data.lists.find((l) => l.id === listId);

  if (!list) {
    return res.status(404).json({ message: "List not found" });
  }

  // Obtener los productos correspondientes a la lista
  const products = list.products.map((productId) =>
    data.products.find((p) => p.id === productId)
  );

  res.json(products);
});

// Eliminar una lista
app.delete("/lists/:id", (req, res) => {
  const data = readData();
  const listId = parseInt(req.params.id);
  const listIndex = data.lists.findIndex((l) => l.id === listId);

  if (listIndex === -1) {
    return res.status(404).json({ message: "List not found" });
  }

  // Eliminar la lista
  data.lists.splice(listIndex, 1);

  // Guardar los datos actualizados
  writeData(data);

  res.json({ message: "List removed successfully" });
});

// Editar el nombre de una lista
app.patch("/lists/:id", (req, res) => {
  const data = readData();
  const listId = parseInt(req.params.id);
  const list = data.lists.find((l) => l.id === listId);

  if (!list) {
    return res.status(404).json({ message: "List not found" });
  }

  const { name } = req.body;
  list.name = name;

  // Guardar los datos actualizados
  writeData(data);

  res.json({ message: "List updated successfully", list });
});

// Editar un producto de una lista
app.patch("/lists/:listId/products/:productId", (req, res) => {
  const data = readData();
  const listId = parseInt(req.params.listId);
  const productId = parseInt(req.params.productId);

  const list = data.lists.find((l) => l.id === listId);
  const product = data.products.find((p) => p.id === productId);

  if (!list || !product) {
    return res.status(404).json({ message: "List or product not found" });
  }

  // Obtener los nuevos datos del producto
  const { name, quantity, unitPrice } = req.body;

  // Validación para asegurarse de que quantity y unitPrice son números positivos
  if (quantity <= 0 || unitPrice <= 0) {
    return res.status(400).json({ message: "Quantity and unit price must be greater than 0" });
  }

  // Calcular el nuevo total del producto
  const totalProduct = quantity * unitPrice;

  // Actualizar el producto con los nuevos valores
  product.name = name;
  product.quantity = quantity;
  product.unitPrice = unitPrice;
  product.totalProduct = totalProduct;

  // Actualizar el total de la lista
  list.total = list.products.reduce((acc, productId) => {
    const productInList = data.products.find((p) => p.id === productId);
    return acc + (productInList ? productInList.totalProduct : 0);
  }, 0);

  // Guardar los datos actualizados
  writeData(data);

  res.json({ message: "Product updated successfully", list });
});

// Eliminar un producto de una lista
app.delete("/lists/:listId/products/:productId", (req, res) => {
  const data = readData();
  const listId = parseInt(req.params.listId);
  const productId = parseInt(req.params.productId);

  const list = data.lists.find((l) => l.id === listId);
  const productIndex = data.products.findIndex((p) => p.id === productId);

  if (!list || productIndex === -1) {
    return res.status(404).json({ message: "List or product not found" });
  }

  const product = data.products[productIndex];
  list.products = list.products.filter((id) => id !== productId);
  list.total -= product.totalProduct;

  // Eliminar el producto de la lista de productos global
  data.products.splice(productIndex, 1);

  // Guardar los datos actualizados
  writeData(data);

  res.json({ message: "Product removed successfully", list });
});

// Servidor
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
