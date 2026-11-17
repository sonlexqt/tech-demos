type JsonSchema = {
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
};

export function renderSchemaForm(
  form: HTMLFormElement,
  schema: JsonSchema,
  value: unknown,
  onChange: (next: unknown) => void,
): void {
  form.innerHTML = "";
  form.append(renderNode(schema, value, onChange));
}

function renderNode(
  schema: JsonSchema,
  value: unknown,
  onChange: (next: unknown) => void,
): HTMLElement {
  const type = schema.type ?? inferType(value);
  if (type === "boolean") return boolField(schema, Boolean(value), onChange);
  if (type === "array") return arrayField(schema, Array.isArray(value) ? value : [], onChange);
  if (type === "object") {
    return objectField(schema, (value && typeof value === "object" ? value : {}) as Record<string, unknown>, onChange);
  }
  if (schema.enum) return enumField(schema, value, onChange);
  return scalarField(schema, value, onChange);
}

function inferType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (value && typeof value === "object") return "object";
  return "string";
}

function labeled(schema: JsonSchema, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "schema-field";
  const span = document.createElement("span");
  span.textContent = schema.title ?? schema.description ?? "";
  if (span.textContent) wrap.append(span);
  wrap.append(control);
  return wrap;
}

function boolField(schema: JsonSchema, value: boolean, onChange: (next: unknown) => void): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = value;
  input.addEventListener("change", () => onChange(input.checked));
  wrap.append(input, document.createTextNode(schema.title ?? "Yes"));
  return wrap;
}

function scalarField(schema: JsonSchema, value: unknown, onChange: (next: unknown) => void): HTMLElement {
  const input = document.createElement("input");
  const isNumber = schema.type === "number" || schema.type === "integer";
  input.type = schema.format === "email" ? "email" : isNumber ? "number" : "text";
  input.value = value == null ? "" : String(value);
  if (schema.type === "number") input.step = "any";
  if (schema.type === "integer") input.step = "1";
  if (schema.minimum !== undefined) input.min = String(schema.minimum);
  if (schema.maximum !== undefined) input.max = String(schema.maximum);
  input.addEventListener("input", () => {
    if (isNumber) onChange(input.value === "" ? 0 : Number(input.value));
    else onChange(input.value);
  });
  return labeled(schema, input);
}

function enumField(schema: JsonSchema, value: unknown, onChange: (next: unknown) => void): HTMLElement {
  const select = document.createElement("select");
  for (const option of schema.enum ?? []) {
    const opt = document.createElement("option");
    opt.value = String(option);
    opt.textContent = String(option);
    if (String(option) === String(value)) opt.selected = true;
    select.append(opt);
  }
  select.addEventListener("change", () => onChange(select.value));
  return labeled(schema, select);
}

function objectField(
  schema: JsonSchema,
  value: Record<string, unknown>,
  onChange: (next: unknown) => void,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "schema-object";
  const props = schema.properties ?? {};
  for (const [key, child] of Object.entries(props)) {
    wrap.append(
      renderNode(child, value[key], (next) => onChange({ ...value, [key]: next })),
    );
  }
  return wrap;
}

function arrayField(schema: JsonSchema, value: unknown[], onChange: (next: unknown) => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "schema-list";
  const title = document.createElement("span");
  title.textContent = schema.title ?? "Items";
  wrap.append(title);
  value.forEach((item, index) => {
    wrap.append(
      renderNode(schema.items ?? {}, item, (next) => {
        const copy = value.slice();
        copy[index] = next;
        onChange(copy);
      }),
    );
  });
  return labeled(schema, wrap);
}
