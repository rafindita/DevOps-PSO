import { db } from "./index";
import { papers } from "./schema/papers";

const TITLE_PREFIXES = [
	"A",
	"On the",
	"Deep Learning for",
	"Neural Network Approaches to",
	"Analysis of",
	"Efficient",
	"Scalable",
	"Novel Approaches to",
	"Attention-based",
	"Transformer Models for",
	"Self-supervised Learning in",
	"Reinforcement Learning for",
	"Graph Neural Networks for",
	"Variational Methods in",
	"Bayesian Approaches to",
	"Convolutional Architectures for",
	"Generative Models for",
	"Adversarial Robustness in",
	"Optimization Methods for",
	"Distributed Training of",
];

const TITLE_TOPICS = [
	"Natural Language Processing",
	"Computer Vision",
	"Speech Recognition",
	"Medical Imaging",
	"Autonomous Driving",
	"Robotics",
	"Recommender Systems",
	"Time Series Forecasting",
	"Anomaly Detection",
	"Image Segmentation",
	"Object Detection",
	"Text Classification",
	"Machine Translation",
	"Question Answering",
	"Sentiment Analysis",
	"Named Entity Recognition",
	"Knowledge Graphs",
	"Drug Discovery",
	"Protein Folding",
	"Genomics",
	"Climate Modeling",
	"Financial Forecasting",
	"Cybersecurity",
	"Network Optimization",
	"Quantum Computing",
	"Edge Computing",
	"Federated Learning",
	"Transfer Learning",
	"Multi-task Learning",
	"Few-shot Learning",
];

const TITLE_SUFFIXES = [
	"",
	"using Attention Mechanisms",
	"with Transformers",
	"via Self-supervision",
	"in the Wild",
	"at Scale",
	"under Distribution Shift",
	"with Limited Data",
	"for Real-time Applications",
	"with Uncertainty Estimation",
];

const ABSTRACT_SENTENCES = [
	"This paper presents a novel approach to",
	"We propose a new method for",
	"In this work, we introduce",
	"We study the problem of",
	"This paper investigates",
	"We present an analysis of",
	"Our work addresses the challenge of",
	"We develop a framework for",
	"We demonstrate significant improvements in",
	"The proposed method achieves state-of-the-art results on",
	"We show that our approach outperforms existing methods",
	"Extensive experiments demonstrate the effectiveness of",
	"Our contributions include",
	"We provide theoretical analysis of",
	"Empirical results show that",
];

const ABSTRACT_CONTINUATIONS = [
	"by leveraging recent advances in deep learning.",
	"using a novel architecture design.",
	"through self-supervised pre-training.",
	"with improved efficiency and scalability.",
	"by incorporating attention mechanisms.",
	"via multi-modal learning approaches.",
	"using graph-based representations.",
	"through adversarial training techniques.",
	"by optimizing for both accuracy and efficiency.",
	"with theoretical guarantees.",
	"using large-scale pre-training.",
	"through knowledge distillation.",
	"by combining multiple modalities.",
];

const FIRST_NAMES = [
	"James",
	"Sarah",
	"Michael",
	"Emily",
	"David",
	"Jennifer",
	"Wei",
	"Anna",
	"Yuki",
	"Mohammed",
	"Maria",
	"Alex",
	"Chen",
	"Lisa",
	"Robert",
	"Sophie",
	"Daniel",
	"Elena",
	"Thomas",
	"Fatima",
	"John",
	"Alice",
	"Marco",
	"Lin",
	"Peter",
	"Hiroshi",
	"Sunita",
	"Carlos",
	"Emma",
	"Ahmed",
];

const LAST_NAMES = [
	"Smith",
	"Johnson",
	"Williams",
	"Wang",
	"Garcia",
	"Miller",
	"Chen",
	"Zhang",
	"Liu",
	"Anderson",
	"Taylor",
	"Thomas",
	"Moore",
	"Jackson",
	"Martin",
	"Lee",
	"Thompson",
	"White",
	"Harris",
	"Clark",
	"Lewis",
	"Robinson",
	"Walker",
	"Kim",
	"Patel",
	"Brown",
	"Jones",
	"Davis",
	"Wilson",
	"Martinez",
];

const KEYWORD_GROUPS = [
	["machine learning", "deep learning", "neural networks"],
	["transformers", "attention mechanism", "NLP"],
	["computer vision", "image classification", "CNN"],
	["reinforcement learning", "policy gradients", "Q-learning"],
	["graph neural networks", "knowledge graphs", "node classification"],
	["generative models", "GANs", "VAE"],
	[
		"self-supervised learning",
		"contrastive learning",
		"representation learning",
	],
	["transfer learning", "fine-tuning", "pre-training"],
	["optimization", "gradient descent", "convergence"],
	["federated learning", "privacy", "distributed systems"],
	["time series", "forecasting", "recurrent networks"],
	["medical imaging", "diagnosis", "healthcare AI"],
	["autonomous systems", "robotics", "planning"],
	["quantum machine learning", "quantum computing", "variational circuits"],
	["adversarial robustness", "security", "defense methods"],
];

function randomElement<T>(arr: readonly T[]): T {
	const index = Math.floor(Math.random() * arr.length);
	return arr[index] as T;
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateArxivId(): string {
	const year = randomInt(20, 24);
	const month = String(randomInt(1, 12)).padStart(2, "0");
	const number = String(randomInt(1, 99_999)).padStart(5, "0");
	return `${year}${month}.${number}`;
}

function generateTitle(): string {
	const prefix = randomElement(TITLE_PREFIXES);
	const topic = randomElement(TITLE_TOPICS);
	const suffix = randomElement(TITLE_SUFFIXES);

	if (prefix === "A" || prefix === "On the") {
		return `${prefix} ${topic}${suffix ? ` ${suffix}` : ""}`;
	}
	return `${prefix} ${topic}${suffix ? ` ${suffix}` : ""}`;
}

function generateAbstract(): string {
	const sentence1 = `${randomElement(ABSTRACT_SENTENCES)} ${generateTitle().toLowerCase()} ${randomElement(ABSTRACT_CONTINUATIONS)}`;
	const sentence2 = `${randomElement(ABSTRACT_SENTENCES)} ${randomElement(ABSTRACT_CONTINUATIONS)}`;
	const sentence3 =
		"We evaluate our approach on several benchmark datasets and demonstrate competitive performance compared to state-of-the-art methods.";
	return `${sentence1} ${sentence2} ${sentence3}`;
}

function generateAuthors(): string[] {
	const count = randomInt(1, 4);
	const authors: string[] = [];
	for (let i = 0; i < count; i++) {
		authors.push(`${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`);
	}
	return authors;
}

function generateKeywords(): string[] {
	const group = randomElement(KEYWORD_GROUPS);
	return group.slice(0, randomInt(2, group.length));
}

function generateDate(): Date {
	const year = randomInt(2020, 2024);
	const month = randomInt(0, 11);
	const day = randomInt(1, 28);
	return new Date(year, month, day);
}

function generatePapers(count: number) {
	const data: Array<{
		title: string;
		abstract: string;
		authors: string[];
		published_at: Date;
		journal: null;
		doi: null;
		keywords: string[];
		source_url: string;
		source: string;
		source_id: string;
		citation_count: number;
		embedding_stored: boolean;
	}> = [];
	const usedIds = new Set<string>();

	for (let i = 0; i < count; i++) {
		let sourceId = generateArxivId();
		while (usedIds.has(sourceId)) {
			sourceId = generateArxivId();
		}
		usedIds.add(sourceId);

		data.push({
			title: generateTitle(),
			abstract: generateAbstract(),
			authors: generateAuthors(),
			published_at: generateDate(),
			journal: null,
			doi: null,
			keywords: generateKeywords(),
			source_url: `https://arxiv.org/abs/${sourceId}`,
			source: "arxiv",
			source_id: sourceId,
			citation_count: randomInt(0, 500),
			embedding_stored: false,
		});
	}

	return data;
}

export async function seed() {
	console.log("Checking if database is already seeded...");

	const existing = await db.select().from(papers).limit(1);
	if (existing.length > 0) {
		console.log("Database already seeded, skipping...");
		return;
	}

	console.log("Generating 500 arXiv papers...");
	const paperData = generatePapers(500);

	console.log("Inserting papers into database...");
	await db.insert(papers).values(paperData);

	console.log(`Successfully seeded ${paperData.length} papers`);
}

seed().catch((error) => {
	console.error("Seed failed:", error);
	process.exit(1);
});
