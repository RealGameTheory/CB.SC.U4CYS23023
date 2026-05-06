#include <algorithm>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

struct Notification {
    std::string id;
    std::string type;
    std::string message;
    std::string timestamp;
    int score;
};

int typeWeight(const std::string& type) {
    if (type == "Placement") return 3;
    if (type == "Result") return 2;
    if (type == "Event") return 1;
    return 0;
}

long long parseTimestamp(const std::string& ts) {
    std::tm tm{};
    std::istringstream ss(ts);
    ss >> std::get_time(&tm, "%Y-%m-%d %H:%M:%S");
    if (ss.fail()) {
        return 0;
    }
    return std::mktime(&tm);
}

std::vector<Notification> topNotifications(const std::vector<Notification>& notifications, size_t topN) {
    std::vector<Notification> copy = notifications;
    std::sort(copy.begin(), copy.end(), [](const Notification& a, const Notification& b) {
        if (a.score != b.score) return a.score > b.score;
        return parseTimestamp(a.timestamp) > parseTimestamp(b.timestamp);
    });
    if (copy.size() > topN) {
        copy.resize(topN);
    }
    return copy;
}

int main(int argc, char* argv[]) {
    std::vector<Notification> notifications = {
        {"d146095a-0d86-4a34-9e69-3900a14576bc", "Result", "mid-sem", "2026-04-22 17:51:30", 0},
        {"a823c8e7-7f90-4b1d-a106-3a7f9c72d404", "Placement", "on-campus drive", "2026-04-23 09:10:12", 0},
        {"9cd9b1c3-8532-4bff-8d36-15cff79f2ba1", "Event", "coding contest", "2026-04-24 12:30:00", 0},
        {"12f4e8a0-b8f5-4b22-a50f-0f9a8e4f9c72", "Placement", "placement result published", "2026-04-25 08:00:00", 0},
        {"3738f7f2-3a7a-4ea5-a7eb-f5c2ff9d1a94", "Result", "exam revaluation update", "2026-04-24 18:15:20", 0}
    };

    for (auto& n : notifications) {
        n.score = typeWeight(n.type);
    }

    size_t topN = 10;
    if (argc > 1) {
        std::istringstream ss(argv[1]);
        ss >> topN;
        if (topN == 0) topN = 10;
    }

    auto top = topNotifications(notifications, topN);

    std::cout << "Top " << top.size() << " notifications:\n";
    for (const auto& n : top) {
        std::cout << "ID: " << n.id << "\n";
        std::cout << "Type: " << n.type << "\n";
        std::cout << "Message: " << n.message << "\n";
        std::cout << "Timestamp: " << n.timestamp << "\n";
        std::cout << "PriorityScore: " << n.score << "\n";
        std::cout << "---\n";
    }

    return 0;
}
