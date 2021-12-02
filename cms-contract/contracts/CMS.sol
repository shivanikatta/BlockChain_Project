// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (token/ERC20/ERC20.sol)

pragma solidity >=0.5.16;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract CMS is IERC20 {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    address public admin;

    struct Recipient {
        address rAddress;
        uint256 amountNeeded;
        bool isRegistered;
        int256 category;
    }

    address[] category1;
    address[] category2;
    address[] category3;

    // struct Donor {
    //   // bytes32 dname;
    //     address dAddress;
    //     bool isRegistered;
    // }

    mapping(address => Recipient) public recipients;

    modifier isOwner() {
        require(msg.sender == admin, "Only Owner have access");
        _;
    }

    function registerRecipient(address recipient) public isOwner {
        recipients[recipient].rAddress = recipient;
        recipients[recipient].amountNeeded = 0;
        recipients[recipient].isRegistered = true;
    }

    function raiseRequest(uint256 reqAmount, int256 categ) public {
        require(
            recipients[msg.sender].isRegistered == true,
            "only Registered recipients can raise request"
        );
        require(categ < 4, "we have only 3 categories to select");
        if (categ == 1) {
            category1.push(msg.sender);
            recipients[msg.sender].category = 1;
        } else if (categ == 2) {
            category2.push(msg.sender);
            recipients[msg.sender].category = 2;
        } else if (categ == 3) {
            category3.push(msg.sender);
            recipients[msg.sender].category = 3;
        }

        recipients[msg.sender].amountNeeded = reqAmount;
    }

    function SelectCategoryToDonate(uint256 categ)
        public
        view
        returns (address, uint256)
    {
        require(categ < 4, "we have only 3 categories to select");
        if (categ == 1) {
            uint256 amount_1 = recipients[category1[0]].amountNeeded;
            return (category1[0], amount_1);
        } else if (categ == 2) {
            uint256 amount_2 = recipients[category2[0]].amountNeeded;
            return (category2[0], amount_2);
        } else if (categ == 3) {
            uint256 amount_3 = recipients[category3[0]].amountNeeded;
            return (category3[0], amount_3);
        }
    }

    function FundTransfer(
        address to,
        uint256 damount,
        uint256 category
    ) public {
        require(
            recipients[to].amountNeeded >= damount,
            "please check the donation amount"
        );
        require(category < 4, "we have only 3 categories");
        bool res = transfer(to, damount);
        uint256 totamountneeded = recipients[to].amountNeeded;
        recipients[to].amountNeeded = totamountneeded - damount;
        if (recipients[to].amountNeeded == 0) {
            deleteFormArray(category, to);
        }
    }

    function deleteFormArray(uint256 catego, address to) private {
        require(
            recipients[to].amountNeeded == 0,
            "Requested amount still remaining"
        );
        //string memory arrayNeeded = "category1";
        if (catego == 1) {
            for (uint256 i = 0; i < category1.length - 1; i++) {
                category1[i] = category1[i + 1];
            }
            delete category1[category1.length - 1];
        } else if (catego == 2) {
            for (uint256 i = 0; i < category2.length - 1; i++) {
                category2[i] = category2[i + 1];
            }
            delete category2[category2.length - 1];
        } else if (catego == 3) {
            for (uint256 i = 0; i < category3.length - 1; i++) {
                category3[i] = category3[i + 1];
            }
            delete category3[category3.length - 1];
        }

        //category1.length--;
    }

    function RemainingAmount(address recipient) public view returns (uint256) {
        return recipients[recipient].amountNeeded;
    }

    function unRegisterRecipient(address recipient) public isOwner {
        require(
            recipients[recipient].amountNeeded == 0,
            "Donation amount is not donated completely"
        );
        //recipients[recipient].amountNeeded = 0;
        recipients[recipient].isRegistered = false;
    }

    constructor(string memory name_, string memory symbol_) public {
        _name = name_;
        _symbol = symbol_;
        _mint(msg.sender, 5000 * 10**18);
        admin = msg.sender;
    }

    function canMint(address to, uint256 amount) external {
        require(msg.sender == admin, "only admin can access");
        _mint(to, amount);
    }

    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function mint(address recipient, uint256 amount) public virtual {
        _mint(recipient, amount);
    }

    function allowance(address owner, address spender)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(
            currentAllowance >= amount,
            "ERC20: transfer amount exceeds allowance"
        );

        _approve(sender, _msgSender(), currentAllowance - amount);

        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        returns (bool)
    {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(
            currentAllowance >= subtractedValue,
            "ERC20: decreased allowance below zero"
        );
        _approve(_msgSender(), spender, currentAllowance - subtractedValue);

        return true;
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        uint256 senderBalance = _balances[sender];
        require(
            senderBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );

        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);

        _afterTokenTransfer(sender, recipient, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);

        _afterTokenTransfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");

        _balances[account] = accountBalance - amount;

        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
