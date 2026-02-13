# Contributing to SNOZCOIN

Thank you for your interest in contributing to SNOZCOIN! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- Clarinet v2.0 or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/SNOZCOIN.git
   cd SNOZCOIN
   ```
3. Install dependencies:
   ```bash
   cd stacks-contracts
   npm install
   ```
4. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## 📝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the "enhancement" label
3. Describe the feature and its benefits
4. Include any relevant examples or mockups

### Submitting Code

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following our coding standards

3. Write or update tests as needed

4. Ensure all tests pass:
   ```bash
   npm test
   clarinet check
   ```

5. Commit with a clear message:
   ```bash
   git commit -m "feat: add your feature description"
   ```

6. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

7. Create a Pull Request

## 📋 Coding Standards

### Clarity Contracts

- Use Clarity version 3
- Include comprehensive error codes
- Add comments for complex logic
- Follow existing naming conventions
- Include unit tests for all public functions

### JavaScript

- Use ES6+ features
- Add JSDoc comments for functions
- Follow existing code style
- Handle errors appropriately

### Commits

We follow Conventional Commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## 🧪 Testing

### Running Tests

```bash
cd stacks-contracts
npm test
```

### Writing Tests

- Test all public functions
- Include edge cases
- Test access control
- Verify error handling

## 📖 Documentation

When adding features:

- Update relevant README files
- Add inline code comments
- Update API documentation if applicable

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help newcomers get started

## ❓ Questions?

- Open an issue for general questions
- Check existing documentation
- Join community discussions

## 🙏 Thank You!

Your contributions make SNOZCOIN better for everyone. We appreciate your time and effort!
