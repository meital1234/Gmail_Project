#pragma once
#ifndef THREAD_MANAGER_H
#define THREAD_MANAGER_H

#include <thread>
#include <functional>
#include <utility>

// This class handles task execution using detached threads.
// In the future, it can be refactored into a real thread pool.
class ThreadManager {
public:
    void run(std::function<void()> task) {
        std::thread(std::move(task)).detach();
    }
};

#endif // THREAD_MANAGER_H