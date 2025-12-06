#!/usr/bin/env python
"""
Test runner script for JuiceQu backend.
Run this script to execute all tests with proper formatting.

Usage:
    python run_tests.py          # Run all tests
    python run_tests.py -v       # Verbose mode
    python run_tests.py --cov    # With coverage
    python run_tests.py auth     # Run only auth tests
"""
import sys
import subprocess


def main():
    """Run tests with pytest."""
    args = ["python", "-m", "pytest", "tests/"]
    
    # Add any command line arguments
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if arg == "--cov":
                args.extend(["--cov=app", "--cov-report=term-missing"])
            elif arg == "-v":
                args.append("-v")
            elif arg in ["auth", "order", "product", "promo", "api"]:
                # Run specific test file
                args = ["python", "-m", "pytest", f"tests/test_{arg}*.py", "-v"]
            else:
                args.append(arg)
    else:
        args.append("-v")
    
    # Run tests
    print("=" * 60)
    print("JUICEQU BACKEND TEST SUITE")
    print("=" * 60)
    print(f"Running command: {' '.join(args)}")
    print("-" * 60)
    
    result = subprocess.run(args)
    
    print("-" * 60)
    if result.returncode == 0:
        print("[PASSED] ALL TESTS PASSED!")
    else:
        print("[FAILED] SOME TESTS FAILED")
    print("=" * 60)
    
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
