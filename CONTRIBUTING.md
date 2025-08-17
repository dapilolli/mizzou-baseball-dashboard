# Contributing to Mizzou Baseball Analytics Dashboard

We love contributions! This guide will help you get started with contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git
- Basic knowledge of React, TypeScript, and baseball analytics

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/mizzou-baseball-dashboard.git
   cd mizzou-baseball-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new components
- Follow existing naming conventions
- Use TailwindCSS for styling (avoid inline styles)
- Add proper TypeScript interfaces for all data structures
- Include JSDoc comments for complex functions

### Component Structure
```typescript
// Component template
import React from 'react';
import { SomeType } from '../types/scouting';

interface ComponentProps {
    prop1: string;
    prop2?: number; // Optional props marked with ?
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
    return (
        <div className="bg-gray-800 rounded-lg p-4">
            {/* Component content */}
        </div>
    );
};

export default Component;
```

### Data and Types
- Add new interfaces to `src/types/scouting.ts`
- Update mock data generators in `src/data/mockData.ts`
- Follow baseball analytics naming conventions (IVB, HB, etc.)
- Use realistic values for mock data

## 🎯 Areas for Contribution

### High Priority
- **Real Data Integration**: Connect to actual baseball data APIs
- **Additional Visualizations**: New chart types and analytics
- **Performance Optimization**: Component optimization and caching
- **Mobile Improvements**: Enhanced mobile responsiveness
- **Accessibility**: ARIA labels and keyboard navigation

### Medium Priority
- **Testing**: Unit tests and integration tests
- **Documentation**: Component documentation and examples
- **Internationalization**: Multi-language support
- **Theme System**: Light/dark theme toggle
- **Advanced Filters**: More sophisticated filtering options

### Low Priority
- **Animation**: Smooth transitions and loading states
- **Export Options**: Additional export formats
- **User Preferences**: Saved settings and preferences
- **Advanced Analytics**: ML-powered insights

## 🧪 Adding New Features

### New Chart Component
1. Create component in `src/components/scouting/`
2. Add TypeScript interfaces if needed
3. Include in parent components
4. Add mock data if required
5. Test responsiveness and dark theme compatibility

### New Data Metric
1. Add to TypeScript interfaces in `src/types/scouting.ts`
2. Update mock data generators
3. Add to relevant components
4. Update documentation

### New Page/Route
1. Create page component in `src/pages/`
2. Add route to routing configuration
3. Update navigation if needed
4. Include proper error handling

## 🔍 Testing

### Manual Testing Checklist
- [ ] All view modes work (Visual, Narrative, Split)
- [ ] Filters function correctly
- [ ] Expandable cards open/close properly
- [ ] Charts render with proper data
- [ ] Print/export functionality works
- [ ] Mobile responsiveness maintained
- [ ] No console errors

### Future Testing
We welcome contributions for:
- Jest unit tests
- React Testing Library integration tests
- E2E testing with Cypress or Playwright

## 📝 Pull Request Process

### Before Submitting
1. **Test Thoroughly**: Ensure your changes work across different scenarios
2. **Check Formatting**: Run any linting/formatting tools
3. **Update Documentation**: Add/update comments and documentation
4. **Verify No Breaking Changes**: Ensure existing functionality still works

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] All view modes tested
- [ ] Mobile responsiveness verified
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots showing the changes

## Additional Notes
Any additional context or notes
```

### Review Process
1. Automated checks will run
2. Maintainers will review code
3. Address any feedback
4. Once approved, changes will be merged

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Safari]
- Version: [e.g. 1.0.0]
```

## 💡 Feature Requests

We welcome feature requests! Please include:
- **Use Case**: Why this feature would be valuable
- **Description**: Detailed description of the feature
- **Mockups**: Visual examples if applicable
- **Priority**: How important this is to your workflow

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: For feedback on implementation approaches

## 🏆 Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes for significant contributions
- Given credit in documentation they help create

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

**Thank you for contributing to the Mizzou Baseball Analytics Dashboard!** 🐅⚾
