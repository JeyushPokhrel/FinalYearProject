import sys
import os
sys.path.append(os.getcwd())
try:
    from search_engine import initialize_search_engine
    print("Import successful")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
