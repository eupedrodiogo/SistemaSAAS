import os
import zipfile
import hashlib

def zip_source_code(output_filename, source_dir):
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build', '.gemini', '.agent', '.vscode', 'coverage']]
            
            for file in files:
                if file.endswith(('.zip', '.log', '.lock', '.txt', '.py', '.md')): # Avoid zipping the script itself or other zips
                     if file != 'package.json' and file != 'tsconfig.json' and file != 'vite.config.ts' and file != 'index.html':
                        continue 
                
                # We mainly want src, public and config files
                # If it's in root, only include specific config files
                if root == source_dir:
                    if file not in ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'tailwind.config.js', 'postcss.config.js']:
                        continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                
    print(f"Zip created: {output_filename}")

def calculate_sha256(filename):
    sha256_hash = hashlib.sha256()
    with open(filename, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

if __name__ == "__main__":
    source_dir = os.getcwd()
    zip_filename = "teranexus_source_v4.zip"
    hash_filename = "software_final_hash_v4.txt"

    print("Zipping source code...")
    zip_source_code(zip_filename, source_dir)
    
    print("Calculating hash...")
    file_hash = calculate_sha256(zip_filename)
    
    with open(hash_filename, "w") as f:
        f.write(file_hash)
        
    print(f"Hash calculated: {file_hash}")
    print(f"Hash saved to: {hash_filename}")
