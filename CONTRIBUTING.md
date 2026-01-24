# Contributing to Open Attendance

Thank you for your interest in contributing to Open Attendance! We welcome contributions from the community.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node.js version, browser)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- A clear description of the feature
- Why you think it would be useful
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository** and create a new branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint    # Check code style
   npm run build   # Ensure it builds
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Follow conventional commits format:
     ```
     feat: add new feature
     fix: correct a bug
     docs: update documentation
     style: format code
     refactor: restructure code
     test: add tests
     chore: update dependencies
     ```

5. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Wait for review**
   - Respond to any feedback
   - Make requested changes if needed

## 📝 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Reference issues and pull requests when applicable

### Testing

- Test your changes locally before submitting
- Ensure existing tests still pass
- Add new tests for new features

## 🌐 Internationalization

When adding new features with user-facing text:
- Add translations to both `messages/en.json` and `messages/ko.json`
- Use the `useTranslations` hook from `next-intl`

## 📚 Documentation

- Update README.md if you change functionality
- Add JSDoc comments for new functions/components
- Update relevant documentation in the `docs/` folder

## ❓ Questions?

If you have questions about contributing, feel free to:
- Open an issue with your question
- Start a discussion in the GitHub Discussions tab

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Open Attendance! 🎉
