/**
 * Atomic Utilities Examples for PhilJS CSS
 */

import { createAtomicSystem } from '../src';
import { theme } from './theme-system';

// ===================================
// 1. Complete Atomic System
// ===================================

export const atoms = createAtomicSystem({
  spacing: theme.spacing,
  colors: theme.colors,
  fontSize: theme.fontSize,
  fontWeight: theme.fontWeight,
  lineHeight: theme.lineHeight,
  letterSpacing: theme.letterSpacing,
  breakpoints: theme.breakpoints
});

// ===================================
// 2. Usage Examples
// ===================================

// Flex layout
export const flexRowExample = [
  atoms.flex,
  atoms.flexRow,
  atoms.itemsCenter,
  atoms.justifyBetween,
  atoms.p4,
  atoms.gap4
].join(' ');

// Card layout
export const cardExample = [
  atoms.bgWhite,
  atoms.p6,
  atoms.rounded8,
  atoms.textBase
].join(' ');

// Button with atomic classes
export const buttonExample = [
  atoms.bgBlue500,
  atoms.textWhite,
  atoms.p4,
  atoms.rounded4,
  atoms.fontMedium,
  atoms.textBase
].join(' ');

// Grid layout
export const gridExample = [
  atoms.grid,
  atoms.gap6,
  atoms.p8
].join(' ');

// Typography
export const headingExample = [
  atoms.text4xl,
  atoms.fontBold,
  atoms.leadingTight,
  atoms.textGray900,
  atoms.mb6
].join(' ');

// Responsive spacing
export const responsiveExample = [
  atoms.p4,
  // atoms['md:p8'],  // Would work with responsive utilities
  // atoms['lg:p12']
].join(' ');

// ===================================
// 3. Component Examples
// ===================================

/**
 * Hero Section
 */
export function HeroSection() {
  const container = [
    atoms.flex,
    atoms.flexCol,
    atoms.itemsCenter,
    atoms.justifyCenter,
    atoms.p8,
    atoms.textCenter
  ].join(' ');

  const title = [
    atoms.text5xl,
    atoms.fontBold,
    atoms.textGray900,
    atoms.mb4
  ].join(' ');

  const subtitle = [
    atoms.textXl,
    atoms.textGray600,
    atoms.mb8
  ].join(' ');

  const buttonGroup = [
    atoms.flex,
    atoms.gap4,
    atoms.itemsCenter
  ].join(' ');

  const primaryButton = [
    atoms.bgBlue500,
    atoms.textWhite,
    atoms.p4,
    atoms.rounded4,
    atoms.fontMedium
  ].join(' ');

  const secondaryButton = [
    atoms.bgGray200,
    atoms.textGray900,
    atoms.p4,
    atoms.rounded4,
    atoms.fontMedium
  ].join(' ');

  return {
    container,
    title,
    subtitle,
    buttonGroup,
    primaryButton,
    secondaryButton
  };
}

/**
 * Navbar
 */
export function Navbar() {
  const nav = [
    atoms.flex,
    atoms.itemsCenter,
    atoms.justifyBetween,
    atoms.p4,
    atoms.bgWhite
  ].join(' ');

  const logo = [
    atoms.text2xl,
    atoms.fontBold,
    atoms.textGray900
  ].join(' ');

  const menu = [
    atoms.flex,
    atoms.gap6,
    atoms.itemsCenter
  ].join(' ');

  const menuItem = [
    atoms.textBase,
    atoms.textGray700,
    atoms.fontMedium
  ].join(' ');

  return {
    nav,
    logo,
    menu,
    menuItem
  };
}

/**
 * Product Card
 */
export function ProductCard() {
  const card = [
    atoms.bgWhite,
    atoms.p6,
    atoms.rounded8
  ].join(' ');

  const imageContainer = [
    atoms.w100,
    atoms.h200,
    atoms.mb4,
    atoms.rounded4
  ].join(' ');

  const title = [
    atoms.textLg,
    atoms.fontSemibold,
    atoms.textGray900,
    atoms.mb2
  ].join(' ');

  const description = [
    atoms.textSm,
    atoms.textGray600,
    atoms.mb4
  ].join(' ');

  const priceRow = [
    atoms.flex,
    atoms.itemsCenter,
    atoms.justifyBetween,
    atoms.mb4
  ].join(' ');

  const price = [
    atoms.text2xl,
    atoms.fontBold,
    atoms.textGray900
  ].join(' ');

  const addToCartButton = [
    atoms.bgBlue500,
    atoms.textWhite,
    atoms.p3,
    atoms.rounded4,
    atoms.fontMedium,
    atoms.textSm
  ].join(' ');

  return {
    card,
    imageContainer,
    title,
    description,
    priceRow,
    price,
    addToCartButton
  };
}

/**
 * Form Layout
 */
export function FormLayout() {
  const form = [
    atoms.bgWhite,
    atoms.p8,
    atoms.rounded8
  ].join(' ');

  const formGroup = [
    atoms.mb6
  ].join(' ');

  const label = [
    atoms.block,
    atoms.textSm,
    atoms.fontMedium,
    atoms.textGray700,
    atoms.mb2
  ].join(' ');

  const input = [
    atoms.w100,
    atoms.p3,
    atoms.textBase,
    atoms.rounded4
  ].join(' ');

  const submitButton = [
    atoms.bgBlue500,
    atoms.textWhite,
    atoms.p4,
    atoms.rounded4,
    atoms.fontSemibold,
    atoms.textBase
  ].join(' ');

  return {
    form,
    formGroup,
    label,
    input,
    submitButton
  };
}

/**
 * Dashboard Layout
 */
export function DashboardLayout() {
  const container = [
    atoms.flex,
    atoms.h100
  ].join(' ');

  const sidebar = [
    atoms.w64,
    atoms.bgGray900,
    atoms.p6
  ].join(' ');

  const mainContent = [
    atoms.flex1,
    atoms.p8,
    atoms.bgGray100
  ].join(' ');

  const header = [
    atoms.flex,
    atoms.itemsCenter,
    atoms.justifyBetween,
    atoms.mb8,
    atoms.bgWhite,
    atoms.p6,
    atoms.rounded8
  ].join(' ');

  const statsGrid = [
    atoms.grid,
    atoms.gap6,
    atoms.mb8
  ].join(' ');

  const statCard = [
    atoms.bgWhite,
    atoms.p6,
    atoms.rounded8
  ].join(' ');

  const statValue = [
    atoms.text3xl,
    atoms.fontBold,
    atoms.textGray900,
    atoms.mb2
  ].join(' ');

  const statLabel = [
    atoms.textSm,
    atoms.textGray600
  ].join(' ');

  return {
    container,
    sidebar,
    mainContent,
    header,
    statsGrid,
    statCard,
    statValue,
    statLabel
  };
}

/**
 * Alert Components
 */
export function AlertComponents() {
  const baseAlert = [
    atoms.p4,
    atoms.rounded4,
    atoms.mb4
  ].join(' ');

  const successAlert = [
    baseAlert,
    atoms.bgGreen500,
    atoms.textWhite
  ].join(' ');

  const errorAlert = [
    baseAlert,
    atoms.bgRed500,
    atoms.textWhite
  ].join(' ');

  const warningAlert = [
    baseAlert,
    atoms.bgYellow500,
    atoms.textWhite
  ].join(' ');

  const infoAlert = [
    baseAlert,
    atoms.bgBlue500,
    atoms.textWhite
  ].join(' ');

  return {
    successAlert,
    errorAlert,
    warningAlert,
    infoAlert
  };
}

/**
 * Table Layout
 */
export function TableLayout() {
  const table = [
    atoms.w100,
    atoms.bgWhite,
    atoms.rounded8
  ].join(' ');

  const thead = [
    atoms.bgGray100
  ].join(' ');

  const th = [
    atoms.p4,
    atoms.textLeft,
    atoms.textSm,
    atoms.fontSemibold,
    atoms.textGray900
  ].join(' ');

  const td = [
    atoms.p4,
    atoms.textSm,
    atoms.textGray700
  ].join(' ');

  const evenRow = [
    atoms.bgGray50
  ].join(' ');

  return {
    table,
    thead,
    th,
    td,
    evenRow
  };
}

/**
 * Modal Layout
 */
export function ModalLayout() {
  const overlay = [
    atoms.fixed,
    atoms.zModal
  ].join(' ');

  const modal = [
    atoms.bgWhite,
    atoms.rounded8,
    atoms.p8
  ].join(' ');

  const header = [
    atoms.flex,
    atoms.itemsCenter,
    atoms.justifyBetween,
    atoms.mb6
  ].join(' ');

  const title = [
    atoms.text2xl,
    atoms.fontBold,
    atoms.textGray900
  ].join(' ');

  const closeButton = [
    atoms.textGray500
  ].join(' ');

  const body = [
    atoms.mb6,
    atoms.textBase,
    atoms.textGray700
  ].join(' ');

  const footer = [
    atoms.flex,
    atoms.gap4,
    atoms.justifyEnd
  ].join(' ');

  return {
    overlay,
    modal,
    header,
    title,
    closeButton,
    body,
    footer
  };
}

/**
 * Blog Post Layout
 */
export function BlogPostLayout() {
  const article = [
    atoms.bgWhite,
    atoms.p8,
    atoms.rounded8
  ].join(' ');

  const featuredImage = [
    atoms.w100,
    atoms.rounded8,
    atoms.mb6
  ].join(' ');

  const meta = [
    atoms.flex,
    atoms.gap4,
    atoms.mb4,
    atoms.textSm,
    atoms.textGray600
  ].join(' ');

  const title = [
    atoms.text4xl,
    atoms.fontBold,
    atoms.textGray900,
    atoms.mb4
  ].join(' ');

  const content = [
    atoms.textBase,
    atoms.textGray700,
    atoms.leadingRelaxed
  ].join(' ');

  const author = [
    atoms.flex,
    atoms.itemsCenter,
    atoms.gap4,
    atoms.mt8,
    atoms.pt8
  ].join(' ');

  const authorAvatar = [
    atoms.w48,
    atoms.h48,
    atoms.rounded8
  ].join(' ');

  const authorInfo = [
    atoms.flex,
    atoms.flexCol,
    atoms.gap1
  ].join(' ');

  const authorName = [
    atoms.fontSemibold,
    atoms.textGray900
  ].join(' ');

  const authorBio = [
    atoms.textSm,
    atoms.textGray600
  ].join(' ');

  return {
    article,
    featuredImage,
    meta,
    title,
    content,
    author,
    authorAvatar,
    authorInfo,
    authorName,
    authorBio
  };
}
