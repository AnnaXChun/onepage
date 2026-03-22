import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Header
    templates: 'Templates',
    pricing: 'Pricing',
    myPages: 'My Pages',
    logout: 'Logout',
    signIn: 'Sign In',
    getStarted: 'Get Started',

    // Home
    noCodingRequired: 'No coding required',
    turnImageInto: 'Turn your image into a',
    stunningWebsite: 'stunning website',
    uploadPhoto: 'Upload a photo, pick a template, and get a beautiful single-page blog in seconds.',
    shareStory: 'Share your story with the world — no technical skills needed.',
    startCreating: 'Start Creating',
    viewTemplates: 'View Templates',
    lightningFast: 'Lightning Fast',
    lightningFastDesc: 'Generate your website in seconds. No waiting, no complexity.',
    beautifulTemplates: 'Beautiful Templates',
    beautifulTemplatesDesc: 'Professionally designed templates for every style.',
    shareAnywhere: 'Share Anywhere',
    shareAnywhereDesc: 'Get a unique link to share your page with the world.',
    readyToCreate: 'Ready to create your page?',
    joinThousands: 'Join thousands of creators who built their online presence with Vibe.',
    createYourPage: 'Create Your Page Now',
    allRightsReserved: '© 2024 Vibe Onepage. All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    everythingYouNeed: 'Everything you need to',
    standOut: 'stand out',

    // Templates Page
    chooseTemplate: 'Choose Template',
    exploreTemplates: 'Explore Our Templates',
    choosePerfectTemplate: 'Choose the perfect template for your personal blog',
    clickToPreview: 'Click to preview',
    free: 'Free',

    // Template Preview
    allTemplates: 'All Templates',
    uploadYourImage: 'Upload your image',
    clickOrDragToUpload: 'Click or drag to upload',
    clickToChange: 'Click to change',
    imageUploaded: 'Image uploaded!',
    useThisTemplate: 'Use this template',
    buyFor: 'Buy for',
    chooseAnotherTemplate: 'Choose another template',

    // Additional
    selectedTemplate: 'selected template',
    price: 'Price',
    buyNow: 'Buy Now',
    failedToCreateBlog: 'Failed to create blog',
    failedToCreateBlogTryAgain: 'Failed to create blog. Please try again.',
    createOrderFailed: 'Failed to create order',
    getQRCodeFailed: 'Failed to get QR code',
    paymentInitFailed: 'Payment initialization failed',
    paymentInitFailedRetry: 'Payment initialization failed, please try again',
    queryPaymentStatusFailed: 'Failed to query payment status',
    paymentCancelledOrExpired: 'Payment cancelled or expired',
    weChatScanToPay: 'WeChat Scan to Pay',
    alipayScanToPay: 'Alipay Scan to Pay',
    failedToLoadBlog: 'Failed to load blog',

    // Upload
    uploadImage: 'Upload Image',
    dropYourImageHere: 'Drop your image here',
    orClickToBrowse: 'or click to browse • JPG, PNG, WebP',
    yourImageLooksGreat: 'Your image looks great',
    continue: 'Continue',
    processing: 'Processing...',

    // Template Select
    selectYourTemplate: 'Select your template',
    step2of3: 'Step 2 of 3',
    chooseTemplateStyle: 'Choose a template that matches your style',
    continueWith: 'Continue with',

    // Preview
    generating: 'Generating...',
    creatingYourPage: 'Creating your page',
    thisOnlyTakes: 'This only takes a few seconds...',
    preview: 'Preview',
    yourPageIsReady: 'Your page is ready',
    hereIsPreview: "Here's a preview of your new blog",
    step3of3: 'Step 3 of 3',
    goBack: 'Go Back',

    // Payment
    checkout: 'Checkout',
    premiumTemplate: 'Premium template purchase',
    total: 'Total',
    selectPaymentMethod: 'Select payment method',
    weChatPay: 'WeChat Pay',
    alipay: 'Alipay',
    pay: 'Pay',
    scanWithWeChat: 'Scan with WeChat to pay',
    scanWithAlipay: 'Scan with Alipay to pay',
    order: 'Order',
    expiresIn: 'Expires in',
    paymentSuccessful: 'Payment Successful!',
    orderDetails: 'Order Details',
    template: 'Template',
    amount: 'Amount',
    status: 'Status',
    tryAgain: 'Try Again',
    cancelAndGoBack: 'Cancel and go back',
    expiringSoon: 'Expiring soon',

    // Success
    youreAllSet: "You're all set!",
    pageIsLive: 'Your page is live and ready to share',
    yourUniqueLink: 'Your unique link',
    shareYourPage: 'Share your page',
    shareLink: 'Share Link',
    publishYourPage: 'Publish Your Page',
    copy: 'Copy',
    copied: 'Copied!',
    shareOnSocialMedia: 'Share on social media',
    createAnotherPage: 'Create another page',
    viewMyOrders: 'View My Orders',
    createYourOnlinePresence: 'Create your online presence.',

    // Orders
    myOrders: 'My Orders',
    refresh: 'Refresh',
    noOrdersYet: 'No orders yet',
    yourPurchaseHistory: 'Your purchase history will appear here',
    orderDetailsTitle: 'Order Details',
    orderNo: 'Order No',
    paymentMethod: 'Payment Method',
    created: 'Created',
    paidAt: 'Paid At',
    tradeNo: 'Trade No',

    // Blog View
    loading: 'Loading...',
    blogNotFound: 'Blog not found',
    createYourOwnBlog: 'Create your own blog',
    noContentYet: 'No content yet.',
    poweredBy: 'Powered by',

    // Login
    welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to continue',
    username: 'Username',
    enterYourUsername: 'Enter your username',
    password: 'Password',
    enterYourPassword: 'Enter your password',
    signingIn: 'Signing in...',
    signInButton: 'Sign In',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign up',
    loginFailed: 'Login failed',
    usernameOrPasswordError: 'Username or password incorrect',

    // Register
    createAccount: 'Create account',
    startCreatingToday: 'Start creating your page today',
    email: 'Email',
    enterYourEmail: 'Enter your email',
    confirmPassword: 'Confirm Password',
    confirmYourPassword: 'Confirm your password',
    createAccountButton: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    registrationFailed: 'Registration failed',
    userMayExist: 'Registration failed, username may already exist',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',

    // Email
    emailRequired: 'Email is required',
    invalidEmail: 'Please enter a valid email address',
    verificationEmailSent: 'Registration successful! Please check your email to verify your account.',
    verificationEmailSentDesc: 'Registration successful! Please check your email to verify your account.',
    resendVerificationLink: 'Resend verification email',
    verificationEmailResent: 'Verification email sent! Check your inbox.',
    sending: 'Sending...',
    resendFailed: 'Failed to resend verification email',
    addEmail: 'Add Email',
    emailNotVerified: 'Email not verified',
    pleaseVerifyEmail: 'Please verify your email first',

    // Errors
    error: 'Error',
    failed: 'Failed',
    tryAgainLater: 'Please try again later',
  },
  zh: {
    // Header
    templates: '模板',
    pricing: '价格',
    myPages: '我的页面',
    logout: '退出登录',
    signIn: '登录',
    getStarted: '开始使用',

    // Home
    noCodingRequired: '无需编码',
    turnImageInto: '将你的图片变成',
    stunningWebsite: '令人惊艳的网站',
    uploadPhoto: '上传照片，选择模板，几秒钟内获得一个漂亮的单页博客。',
    shareStory: '与世界分享你的故事——无需任何技术技能。',
    startCreating: '开始创建',
    viewTemplates: '查看模板',
    lightningFast: '闪电般快速',
    lightningFastDesc: '几秒钟内生成你的网站。无需等待，没有复杂性。',
    beautifulTemplates: '精美模板',
    beautifulTemplatesDesc: '专业设计的模板，适合各种风格。',
    shareAnywhere: '随时分享',
    shareAnywhereDesc: '获得一个独特的链接，与世界分享你的页面。',
    readyToCreate: '准备好创建你的页面了吗？',
    joinThousands: '加入成千上万的创作者，用 Vibe 建立他们的在线形象。',
    createYourPage: '立即创建你的页面',
    allRightsReserved: '© 2024 Vibe Onepage. 保留所有权利。',
    privacy: '隐私政策',
    terms: '服务条款',
    contact: '联系我们',

    // Templates Page
    chooseTemplate: '选择模板',
    exploreTemplates: '探索我们的模板',
    choosePerfectTemplate: '为你的个人博客选择完美的模板',
    clickToPreview: '点击预览',
    free: '免费',

    // Template Preview
    allTemplates: '所有模板',
    uploadYourImage: '上传你的图片',
    clickOrDragToUpload: '点击或拖拽上传',
    clickToChange: '点击更换',
    imageUploaded: '图片已上传！',
    useThisTemplate: '使用此模板',
    buyFor: '购买价格',
    chooseAnotherTemplate: '选择其他模板',

    // Additional
    selectedTemplate: '已选模板',
    price: '价格',
    buyNow: '立即购买',
    failedToCreateBlog: '创建博客失败',
    failedToCreateBlogTryAgain: '创建博客失败，请重试',
    createOrderFailed: '创建订单失败',
    getQRCodeFailed: '获取二维码失败',
    paymentInitFailed: '支付初始化失败',
    paymentInitFailedRetry: '支付初始化失败，请重试',
    queryPaymentStatusFailed: '查询支付状态失败',
    paymentCancelledOrExpired: '支付已取消或过期',
    weChatScanToPay: '微信扫码支付',
    alipayScanToPay: '支付宝扫码支付',
    failedToLoadBlog: '加载博客失败',

    // Upload
    uploadImage: '上传图片',
    dropYourImageHere: '拖拽图片到这里',
    orClickToBrowse: '或点击浏览 • JPG, PNG, WebP',
    yourImageLooksGreat: '你的图片看起来很棒',
    continue: '继续',
    processing: '处理中...',

    // Template Select
    selectYourTemplate: '选择你的模板',
    step2of3: '第 2 步，共 3 步',
    chooseTemplateStyle: '选择符合你风格的模板',
    continueWith: '继续使用',

    // Preview
    generating: '生成中...',
    creatingYourPage: '正在创建你的页面',
    thisOnlyTakes: '这只需要几秒钟...',
    preview: '预览',
    yourPageIsReady: '你的页面已就绪',
    hereIsPreview: '这是你的新博客预览',
    step3of3: '第 3 步，共 3 步',
    goBack: '返回',

    // Payment
    checkout: '结账',
    premiumTemplate: '高级模板购买',
    total: '总计',
    selectPaymentMethod: '选择支付方式',
    weChatPay: '微信支付',
    alipay: '支付宝',
    pay: '支付',
    scanWithWeChat: '使用微信扫描支付',
    scanWithAlipay: '使用支付宝扫描支付',
    order: '订单',
    expiresIn: '过期时间',
    paymentSuccessful: '支付成功！',
    orderDetails: '订单详情',
    template: '模板',
    amount: '金额',
    status: '状态',
    tryAgain: '重试',
    cancelAndGoBack: '取消并返回',
    expiringSoon: '即将过期',

    // Success
    youreAllSet: '一切就绪！',
    pageIsLive: '你的页面已上线，可以分享了',
    yourUniqueLink: '你的专属链接',
    shareYourPage: '分享你的页面',
    shareLink: '分享链接',
    publishYourPage: '发布页面',
    copy: '复制',
    copied: '已复制！',
    shareOnSocialMedia: '在社交媒体分享',
    createAnotherPage: '创建另一个页面',
    viewMyOrders: '查看我的订单',
    createYourOnlinePresence: '创建你的在线形象。',

    // Orders
    myOrders: '我的订单',
    refresh: '刷新',
    noOrdersYet: '暂无订单',
    yourPurchaseHistory: '你的购买记录将显示在这里',
    orderDetailsTitle: '订单详情',
    orderNo: '订单号',
    paymentMethod: '支付方式',
    created: '创建时间',
    paidAt: '支付时间',
    tradeNo: '交易号',

    // Blog View
    loading: '加载中...',
    blogNotFound: '博客未找到',
    createYourOwnBlog: '创建你自己的博客',
    noContentYet: '暂无内容。',
    poweredBy: '由',

    // Login
    welcomeBack: '欢迎回来',
    signInToContinue: '登录以继续',
    username: '用户名',
    enterYourUsername: '输入你的用户名',
    password: '密码',
    enterYourPassword: '输入你的密码',
    signingIn: '登录中...',
    signInButton: '登录',
    dontHaveAccount: '还没有账户？',
    signUp: '注册',
    loginFailed: '登录失败',
    usernameOrPasswordError: '用户名或密码错误',

    // Register
    createAccount: '创建账户',
    startCreatingToday: '今天就开始创建你的页面',
    email: '邮箱',
    enterYourEmail: '输入你的邮箱',
    confirmPassword: '确认密码',
    confirmYourPassword: '再次输入你的密码',
    createAccountButton: '创建账户',
    creatingAccount: '正在创建账户...',
    alreadyHaveAccount: '已有账户？',
    signInLink: '登录',
    registrationFailed: '注册失败',
    userMayExist: '注册失败，用户名可能已存在',
    passwordsDoNotMatch: '两次密码输入不一致',
    passwordTooShort: '密码至少需要6个字符',

    // Email
    emailRequired: '邮箱不能为空',
    invalidEmail: '请输入有效的邮箱地址',
    verificationEmailSent: '注册成功！请查收邮件验证您的账户。',
    verificationEmailSentDesc: '注册成功！请查收邮件验证您的账户。',
    resendVerificationLink: '重新发送验证邮件',
    verificationEmailResent: '验证邮件已发送！请查收。',
    sending: '发送中...',
    resendFailed: '重发验证邮件失败',
    addEmail: '添加邮箱',
    emailNotVerified: '邮箱未验证',
    pleaseVerifyEmail: '请先验证您的邮箱',

    // Errors
    error: '错误',
    failed: '失败',
    tryAgainLater: '请稍后重试',
  }
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en')
  }

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider')
  }
  return context
}

export default { LanguageProvider, useTranslation }
