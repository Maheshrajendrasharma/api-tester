import { useEffect, useRef, useState } from "react";

function EnvironmentSelector({
    environments = [],
    onChange,
}) {
    const activeEnvironment =
        environments.find((environment) => environment.active) ??
        environments[0];

    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Automatically focus the dropdown/search field
    // immediately after opening.
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside.
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchText("");
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const filteredEnvironments = environments.filter((environment) =>
        environment.name
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

    function handleSelect(environment) {
        onChange(environment.id);
        setIsOpen(false);
        setSearchText("");
    }

    function handleDropdownClick() {
        setIsOpen((current) => !current);
    }

    return (
        <div
            className={`environment-selector ${isOpen ? "is-open" : ""}`}
            ref={containerRef}
        >
            <div
                className="environment-selector-control"
                onClick={handleDropdownClick}
            >
                {isOpen ? (
                    <>
                        <span className="environment-search-icon">
                            🔍
                        </span>

                        <input
                            ref={inputRef}
                            type="text"
                            value={searchText}
                            onChange={(event) =>
                                setSearchText(event.target.value)
                            }
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                            placeholder={
                                activeEnvironment?.name ||
                                "Search environment..."
                            }
                            className="environment-search-input"
                        />

                        <span className="environment-chevron">
                            ▲
                        </span>
                    </>
                ) : (
                    <>
                        <span className="environment-current-name">
                            {activeEnvironment?.name ||
                                "Select environment"}
                        </span>

                        <span className="environment-chevron">
                            ▼
                        </span>
                    </>
                )}
            </div>

            {isOpen && (
                <div className="environment-dropdown">
                    {filteredEnvironments.length > 0 ? (
                        filteredEnvironments.map((environment) => (
                            <button
                                key={environment.id}
                                type="button"
                                className={`environment-option ${
                                    environment.id ===
                                    activeEnvironment?.id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleSelect(environment)
                                }
                            >
                                {environment.name}
                            </button>
                        ))
                    ) : (
                        <div className="environment-no-results">
                            No environment found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EnvironmentSelector;