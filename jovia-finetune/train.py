"""Simple scaffold for fine-tuning an astro-text model with Hugging Face Trainer."""
from pathlib import Path

from datasets import load_dataset
from transformers import (AutoModelForCausalLM, AutoTokenizer, Trainer,
                          TrainingArguments, DataCollatorForLanguageModeling)

DATA_FILE = Path(__file__).parent / "jovia_tuning.jsonl"
MODEL_NAME = "distilgpt2"
OUTPUT_DIR = Path(__file__).parent / "outputs"


def tokenize(example, tokenizer):
    joined = example["prompt"] + "\n" + example["completion"]
    return tokenizer(joined)


def main():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

    if tokenizer.pad_token is None:
        tokenizer.add_special_tokens({"pad_token": tokenizer.eos_token})
        model.resize_token_embeddings(len(tokenizer))

    dataset = load_dataset("json", data_files=str(DATA_FILE), split="train")
    tokenized = dataset.map(lambda e: tokenize(e, tokenizer), batched=True)

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        per_device_train_batch_size=2,
        num_train_epochs=3,
        learning_rate=5e-5,
        weight_decay=0.01,
        logging_steps=10,
        save_total_limit=1,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=data_collator,
    )

    trainer.train()
    trainer.save_model(str(OUTPUT_DIR / "final"))


if __name__ == "__main__":
    main()
