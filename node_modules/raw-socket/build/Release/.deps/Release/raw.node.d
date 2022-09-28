cmd_Release/raw.node := ln -f "Release/obj.target/raw.node" "Release/raw.node" 2>/dev/null || (rm -rf "Release/raw.node" && cp -af "Release/obj.target/raw.node" "Release/raw.node")
