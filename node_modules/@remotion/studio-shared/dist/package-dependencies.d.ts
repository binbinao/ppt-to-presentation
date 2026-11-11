import type { PackageInstallSpec } from './api-requests';
export declare const TRANSFORMERS_PACKAGE = "@huggingface/transformers";
export declare const withRequiredAuxiliaryPackages: (dependencies: readonly PackageInstallSpec[]) => PackageInstallSpec[];
export declare const uniquePackageDependencies: (dependencies: readonly PackageInstallSpec[]) => PackageInstallSpec[];
export declare const getMissingPackageDependencies: ({ dependencies, installedPackages, }: {
    dependencies: readonly PackageInstallSpec[];
    installedPackages: readonly string[];
}) => PackageInstallSpec[];
