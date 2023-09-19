int Outputs[] = {5, 4, 11, 2, 3, 13, A5, A4, A3};
int Inputs[] = {A2, A1, A0, 12, 10, 9, 8, 7, 6};
int gridSize[] = {9, 9};
const int tiles = 81;
unsigned long board[tiles];

char *int2bin(unsigned long x) {
    static char buffer[33];
    unsigned long mask = 1;
    for (int i = 0; i < 32; i++) {
        buffer[31 - i] = '0' + ((x & (mask << i)) > 0);
    }
    buffer[32] = '\0';
    return buffer;
}

void setup() {
    for (int i = 0; i < tiles; i++)
        board[i] = 0;

    for (int i = 0; i < gridSize[0]; i++) {
        pinMode(Outputs[i], OUTPUT);
        digitalWrite(Outputs[i], HIGH);
    }
    for (int i = 0; i < gridSize[0]; i++) {
        pinMode(Inputs[i], INPUT_PULLUP);
    }

    Serial.begin(500000);
}

bool scanGrid = false;
String incomingBytes = "";
String gridArray = "";
String previousGrid = "";
void loop() {
    gridArray = "";
    if (Serial.available() > 0) {
        incomingBytes = Serial.readString();
        if (incomingBytes.indexOf("a") != -1) {
            Serial.print("Test");
        }
        if (incomingBytes.indexOf("b") != -1) {
            scanGrid = true;
        }
        if (incomingBytes.indexOf("c") != -1) {
            scanGrid = false;
        }
    }

    if (scanGrid) {
        for (int y = 0; y < gridSize[0]; y++) {
            digitalWrite(Outputs[y], LOW);
            for (int x = 0; x < gridSize[1]; x++) {
                board[y * gridSize[0] + x] = board[y * gridSize[0] + x] << 1;
                if (digitalRead(Inputs[x]) == LOW) {
                    board[y * gridSize[0] + x] += 1;
                }
                char *tileData = int2bin(board[y * gridSize[0] + x]);
                byte oneCount = 0;
                for (byte i = 0; i < 32; i++) {
                    oneCount += tileData[i] == '1' ? 1 : 0;
                }
                gridArray += oneCount > 16 ? "1" : "0";
            }
            digitalWrite(Outputs[y], HIGH);
        }
        if (!gridArray.equals(previousGrid)) {
            Serial.print(gridArray);
            Serial.print("|");
            previousGrid = String(gridArray);
        }
    }
}
