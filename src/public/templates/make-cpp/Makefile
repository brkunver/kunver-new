CXX = g++
CXXFLAGS = -std=c++20 -Wall -Iinclude

SRC_DIR = src
OBJ_DIR = obj
BIN_DIR = bin

TARGET = $(BIN_DIR)/app

SRCS = $(wildcard $(SRC_DIR)/*.cpp)
OBJS = $(patsubst $(SRC_DIR)/%.cpp,$(OBJ_DIR)/%.o,$(SRCS))

all: $(TARGET)

$(TARGET): $(OBJS)
	@mkdir -p $(BIN_DIR)
	@$(CXX) $(OBJS) -o $(TARGET)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(OBJ_DIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

dev: all
	@./$(TARGET)

	# make new <name>
new:
	@if [ "$(word 2, $(MAKECMDGOALS))" = "" ]; then \
		echo "Usage: make new <name>"; \
		exit 1; \
	fi
	@name=$(word 2, $(MAKECMDGOALS)); \
	echo "Creating src/$$name.cpp and include/$$name.hpp..."; \
	mkdir -p src include; \
	echo "#include \"$$name.hpp\"" > src/$$name.cpp; \
	echo "#pragma once" > include/$$name.hpp; \
	echo "Done!"

# ignore extra args (so make doesn't treat them as targets)
%:
	@:

clean:
	rm -rf $(OBJ_DIR) $(BIN_DIR)
