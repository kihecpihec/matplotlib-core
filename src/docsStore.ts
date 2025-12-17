import fs from "fs/promises";
import path from "path";

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; language?: string; code: string }
  | { type: "image"; src: string; caption?: string; alt?: string };

export interface DocPage {
  id: string;
  title: string;
  breadcrumb: string[];
  blocks: DocBlock[];
  updatedAt: string;
}

type DocsDb = Record<string, DocPage>;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "docs-pages.json");

const DEFAULT_PAGES: DocsDb = {
  "getting-started": {
    id: "getting-started",
    title: "Dynamic Docs (Getting Started)",
    breadcrumb: ["Documentation", "Dynamic"],
    blocks: [
      {
        type: "p",
        text: "This page is rendered from JSON fetched from the backend. Update it with a PUT request and it will refresh automatically.",
      },
      {
        type: "h2",
        text: "1. Try updating this page",
      },
      {
        type: "code",
        language: "bash",
        code: `curl -X PUT http://localhost:3001/api/docs/pages/getting-started \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Dynamic Docs (Updated!)",
    "breadcrumb": ["Documentation", "Dynamic"],
    "blocks": [
      { "type": "p", "text": "Updated from the backend at runtime." },
      { "type": "h2", "text": "Now add any blocks you want" },
      { "type": "ul", "items": ["Paragraphs", "Headings", "Lists", "Code blocks"] },
      { "type": "code", "language": "python", "code": "print(\\"hello from dynamic docs\\")" }
    ]
  }'`,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-01": {
    id: "template-01",
    title: "Template 01 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 01"],
    blocks: [
      {
        type: "p",
        text: "This is Template 01. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-01')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-02": {
    id: "template-02",
    title: "Template 02 — Notebook: Passenger Satisfaction Analysis",
    breadcrumb: ["Documentation", "Templates", "Template 02", "Notebook"],
    blocks: [
      {
        type: "p",
        text: "Content sourced from `Untiteled5.ipynb` (import + EDA + cleaning + preprocessing + regression).",
      },
      { type: "h2", text: "1) Load + merge passenger datasets" },
      {
        type: "code",
        language: "python",
        code: `import pandas as pd

df1 = pd.read_excel("passengers_satisfaction.xlsx", index_col="passenger_id")
df2 = pd.read_csv("passengers_service_rating.txt", sep="\\t", index_col="passenger_id")
df3 = pd.read_csv("passengers.csv", sep=";", index_col=0)

df = pd.concat([df1, df2, df3], axis=1)
df.index.name = "Passenger_id"
df.head()

print("Oblika podatkov: ", df.shape)

print("Številčni stolpci in tipi:")
print(df.select_dtypes(include=["number"]).dtypes, "\\n")

print("Prve 4 vrstice:")
print(df.head(4), "\\n")

print("Prve 4 vrstice:")
print(df.iloc[:4, :], "\\n")

if "110022" in df.index.astype(str):
    print("Potnik 110022 - starost:", df.loc[110022, "Age"], ", spol:", df.loc[110022, "Gender"])
else:
    print("Ne obstaja.")

print("Število potnikov z ID, ki se začne s '25':", df[df.index.astype(str).str.startswith("25")].shape[0], "\\n")

print("Opisna statistika za decimalne stolpce:")
print(df.select_dtypes(include=["float"]).describe())`,
      },
      {
        type: "h2",
        text: "2) Quick EDA: scatter by class, age boxplot, max delay by satisfaction",
      },
      {
        type: "code",
        language: "python",
        code: `import matplotlib.pyplot as plt
import seaborn as sns

classes = df["Class"].dropna().unique()
fig, axes = plt.subplots(len(classes), 1, figsize=(6, 3*len(classes)))
if len(classes) == 1: axes = [axes]
for ax, c in zip(axes, classes):
    subset = df[df["Class"] == c]
    ax.scatter(subset["Flight Distance"], subset["Food and drink"], alpha=0.4, s=10)
    ax.set_title(f"Class: {c}")
    ax.set_xlabel("Flight Distance")
    ax.set_ylabel("Food and drink")
plt.tight_layout()
plt.show()

plt.figure(figsize=(4, 3))
plt.boxplot(df["Age"].dropna())
plt.title("Starost potnikov")
plt.ylabel("Age")
plt.show()

max_delay = df.groupby("Satisfaction")["Arrival Delay in Minutes"].max()
max_delay.plot(kind="bar", color=sns.color_palette("Greens", len(max_delay)), figsize=(5,3))
plt.title("Max Arrival Delay po Satisfaction")
plt.ylabel("Minutes")
plt.show()`,
      },
      {
        type: "h2",
        text: "3) Under-30 analysis + travel distance summary + oldest low-rating passengers",
      },
      {
        type: "code",
        language: "python",
        code: `young = df[df["Age"] < 30]
avg_rating = young.groupby(["Age", "Class"])["Final_rating"].mean().reset_index()
plt.figure(figsize=(6,4))
for c in ["Business", "Eco", "Eco Plus"]:
    sub = avg_rating[avg_rating["Class"] == c]
    plt.plot(sub["Age"], sub["Final_rating"], label=c, linewidth=1.5)
plt.legend()
plt.title("Povprečna ocena leta <30 let")
plt.xlabel("Age")
plt.ylabel("Avg Final_rating")
plt.show()

avg_distance = df.groupby("Type of Travel")["Flight Distance"].mean().round(1)
print(" Povprečna dolžina leta glede na namen potovanja")
for travel_type, val in avg_distance.items():
    print(f"{travel_type}: {val}")

table = df[(df["Satisfaction"] == "neutral or dissatisfied") &
           (df["Final_rating"].between(11, 14))]
table = table[["Age", "Class", "Final_rating"]].sort_values("Age")
print("5 najstarejših nezadovoljnih potnikov z ratingom 11–14")
print(table.tail(5).to_string(index=False))`,
      },
      { type: "h2", text: "4) Handle missing values + drop remaining NA" },
      {
        type: "code",
        language: "python",
        code: `print("Manjkajoči podatki")
print(df.isna().sum()[df.isna().sum() > 0])

mean_distance = df["Flight Distance"].mean()
df["Flight Distance"] = df["Flight Distance"].fillna(mean_distance)

mask = df["Arrival Delay in Minutes"].isna()
df.loc[mask, "Arrival Delay in Minutes"] = df.loc[mask, "Departure Delay in Minutes"] + 2

mode_class = df["Class"].mode()[0]
df["Class"] = df["Class"].fillna(mode_class)

df = df.dropna()

print("\\nManjkajoči podatki")
print(df.isna().sum()[df.isna().sum() > 0])

print("\\nŠtevilo vrstic po čiščenju")
print(df.shape[0])`,
      },
      {
        type: "h2",
        text: "5) Prepare datasets for classification + regression",
      },
      {
        type: "code",
        language: "python",
        code: `dfRegresija = df.copy()
dfKlasifikacija = df.copy()

from sklearn.preprocessing import LabelEncoder

le = LabelEncoder()
dfKlasifikacija["Satisfaction"] = le.fit_transform(dfKlasifikacija["Satisfaction"])

X_class = dfKlasifikacija.drop(columns=["Final_rating"])
y_class = dfKlasifikacija["Satisfaction"]
dfKlasifikacija = pd.concat([X_class, y_class], axis=1)

dfRegresija = pd.get_dummies(dfRegresija, drop_first=True)

print("\\nZadnje 3 vrstice dfKlasifikacija")
print(dfKlasifikacija.tail(3))

print("\\nZadnje 3 vrstice dfRegresija")
print(dfRegresija.tail(3))`,
      },
      { type: "h2", text: "6) Correlation: most correlated with Final_rating" },
      {
        type: "code",
        language: "python",
        code: `corr = dfRegresija.corr()["Final_rating"].drop("Final_rating")
most_corr = corr.abs().idxmax()
print("Najbolj koreliran stolpec s Final_rating:", most_corr)`,
      },
      { type: "h2", text: "7) Train/test split (regression)" },
      {
        type: "code",
        language: "python",
        code: `X = dfRegresija.drop(columns=["Final_rating", most_corr])
y = dfRegresija["Final_rating"]

from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=1/3, random_state=42)
print("Oblika učenja:", X_train.shape, "Oblika testiranja:", X_test.shape)`,
      },
      {
        type: "h2",
        text: "8) Decision Tree Regressor (MSE)",
      },
      {
        type: "code",
        language: "python",
        code: `from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error

tree = DecisionTreeRegressor(random_state=42)
tree.fit(X_train, y_train)
y_pred_tree = tree.predict(X_test)
mse_tree = mean_squared_error(y_test, y_pred_tree)
print("MSE  (Decision Tree):", round(mse_tree, 2))`,
      },
      { type: "h2", text: "9) KNN Regressor (MSE)" },
      {
        type: "code",
        language: "python",
        code: `from sklearn.neighbors import KNeighborsRegressor

knn = KNeighborsRegressor()
knn.fit(X_train, y_train)
y_pred_knn = knn.predict(X_test)
mse_knn = mean_squared_error(y_test, y_pred_knn)
print("MSE (KNN):", round(mse_knn, 2))`,
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-03": {
    id: "template-03",
    title: "Template 03 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 03"],
    blocks: [
      {
        type: "p",
        text: "This is Template 03. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-03')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-04": {
    id: "template-04",
    title: "Template 04 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 04"],
    blocks: [
      {
        type: "p",
        text: "This is Template 04. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-04')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-05": {
    id: "template-05",
    title: "Template 05 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 05"],
    blocks: [
      {
        type: "p",
        text: "This is Template 05. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-05')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-06": {
    id: "template-06",
    title: "Template 06 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 06"],
    blocks: [
      {
        type: "p",
        text: "This is Template 06. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-06')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-07": {
    id: "template-07",
    title: "Template 07 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 07"],
    blocks: [
      {
        type: "p",
        text: "This is Template 07. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-07')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-08": {
    id: "template-08",
    title: "Template 08 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 08"],
    blocks: [
      {
        type: "p",
        text: "This is Template 08. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-08')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-09": {
    id: "template-09",
    title: "Template 09 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 09"],
    blocks: [
      {
        type: "p",
        text: "This is Template 09. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-09')" },
    ],
    updatedAt: new Date().toISOString(),
  },
  "template-10": {
    id: "template-10",
    title: "Template 10 (Dynamic)",
    breadcrumb: ["Documentation", "Templates", "Template 10"],
    blocks: [
      {
        type: "p",
        text: "This is Template 10. Update it via the backend PUT endpoint.",
      },
      { type: "h2", text: "Section A" },
      { type: "ul", items: ["Point 1", "Point 2", "Point 3"] },
      { type: "code", language: "python", code: "print('template-10')" },
    ],
    updatedAt: new Date().toISOString(),
  },
};

let cache: DocsDb | null = null;

async function ensureLoaded(): Promise<DocsDb> {
  if (cache) return cache;
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as DocsDb;
    cache =
      parsed && typeof parsed === "object" ? parsed : { ...DEFAULT_PAGES };
    return cache;
  } catch {
    cache = { ...DEFAULT_PAGES };
    await fs.writeFile(DB_PATH, JSON.stringify(cache, null, 2), "utf8");
    return cache;
  }
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.every((x) => typeof x === "string" && x.trim().length > 0)
  );
}

function isDocBlock(v: unknown): v is DocBlock {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  const type = obj.type;

  if (type === "p" || type === "h2") return isNonEmptyString(obj.text);
  if (type === "ul")
    return (
      Array.isArray(obj.items) &&
      obj.items.every((x) => typeof x === "string" && x.trim().length > 0)
    );
  if (type === "code") return isNonEmptyString(obj.code);
  if (type === "image") return isNonEmptyString(obj.src);

  return false;
}

export async function listDocPages(): Promise<DocPage[]> {
  const db = await ensureLoaded();
  return Object.values(db).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export async function getDocPage(id: string): Promise<DocPage | null> {
  const db = await ensureLoaded();
  return db[id] ?? null;
}

export async function upsertDocPage(
  id: string,
  payload: unknown
): Promise<DocPage> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid body; expected JSON object.");
  }

  const body = payload as Record<string, unknown>;
  const title = body.title;
  const breadcrumb = body.breadcrumb;
  const blocks = body.blocks;

  if (!isNonEmptyString(title)) {
    throw new Error("title is required and must be a non-empty string.");
  }
  if (!isStringArray(breadcrumb)) {
    throw new Error("breadcrumb is required and must be an array of strings.");
  }
  if (!Array.isArray(blocks) || !blocks.every(isDocBlock)) {
    throw new Error(
      "blocks is required and must be an array of valid block objects."
    );
  }

  const db = await ensureLoaded();
  const page: DocPage = {
    id,
    title: title.trim(),
    breadcrumb: breadcrumb.map((s) => s.trim()),
    blocks: blocks as DocBlock[],
    updatedAt: new Date().toISOString(),
  };
  db[id] = page;

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");

  cache = db;
  return page;
}
