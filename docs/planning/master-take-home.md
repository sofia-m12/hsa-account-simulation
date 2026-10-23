

# Human Interest SWE 1 Take-Home Assignment

## HSA Account Simulation

AI Tools: Expected and Evaluated.

You are expected to use AI tools while completing this assignment. Document the tools you used, and be prepared to explain how you used them. You should still be able to clearly explain the system you built, defend your design choices, and verify correctness yourself.

## Background

A Health Savings Account (HSA) is a tax-advantaged account used to pay for medical expenses.

In this assignment, you will build an HSA platform that allows users to:

- Create accounts

- Deposit funds

- Receive a debit card

- Process transactions

The goal is to demonstrate your ability to design and implement a well-structured web application.

## AI Collaboration Requirement

Include a document named:

ai-usage.md

Use it to explain:

- Which AI tools you used

- Which parts of the project AI helped with

- 2 or 3 representative prompts or workflows you used

- One example where AI output was wrong, incomplete, or unhelpful, and how you corrected it

- How you verified the final implementation

AI usage is expected. We are looking for strong judgment, ownership, and verification.

## Requirements

### Core Features

#### 1. Create an HSA Account

Define the account information your system needs.

#### 2. Deposit Funds

Users should be able to deposit funds into their HSA account.

#### 3. Issue a Card

Each account may have a virtual debit card associated with it.

#### 4. Process Transactions

Define the transaction inputs your system needs.

Your system must determine whether a purchase is a qualified medical expense. Example:

Pharmacy → Valid

Hospital → Valid

Restaurant → Invalid

Electronics → Invalid

### Important System Constraint

Your system must correctly handle concurrent transactions. Example:

Account Balance: $100

Transaction A: $80

Transaction B: $50

Your system must ensure:

- The balance never becomes negative

- Only valid transactions are approved

## Technical Requirements

Provide a web UI that allows a reviewer to:

- Create accounts

- Deposit funds

- Issue cards

- Simulate transactions

The UI must run locally and make the core flows easy to evaluate.

Persist and model the data your solution requires, and explain those decisions in the documentation.

## Architecture Documentation

Your repository must include:

architecture.md

Explain:

- System architecture

- Request flow

- Data model

- Concurrency handling

- Design tradeoffs

## Demo Video (Up to 5 Minutes)

Create a short video that explains your project.

Please cover:

1. Demo of the application

2. System architecture

3. Data model

4. How transactions are processed

5. What you would improve with more time

6. How you used AI during development and how you validated its output

## Submission

Please submit:

- A GitHub repository

- README with setup instructions

- architecture.md

- ai-usage.md

- A link to the demo video

The project must run locally.

